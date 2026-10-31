import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '../../utils/auth.js';
import { db } from '../../utils/db.js';
import { VerificationStatus } from '@prisma/client';
import { findCatalogService, resolveServices } from '../../utils/serviceCatalog.js';
import { ServiceChangeError, assertServiceChangeAllowed } from '../../services/providerEligibility.js';

function mapToContractorProfile(profile: any) {
  return {
    id: profile.id,
    userId: profile.userId,
    companyName: profile.businessName || '',
    ownerName: profile.fullName || '',
    phoneNumber: profile.phoneNumber,
    experienceYears: profile.experienceYears,
    specialization: profile.category ? profile.category.name : '',
    serviceAreas: profile.serviceAreas,
    description: profile.description,
    verificationStatus: profile.verificationStatus,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
  }

  const method = req.method;

  switch (method) {
    case 'GET':
      try {
        const profile = await db.providerProfile.findUnique({
          where: { userId: user.id },
          include: { category: true },
        });
        if (!profile) {
          return res.status(404).json({ success: false, message: 'Contractor profile not found' });
        }
        return res.status(200).json({ success: true, data: mapToContractorProfile(profile) });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
      }

    case 'POST':
    case 'PUT':
      // Only professional accounts may hold a professional profile; customers cannot create one here.
      if (user.role !== 'PROVIDER') {
        return res.status(403).json({ success: false, message: 'Only professional accounts can manage a professional profile.' });
      }
      try {
        const {
          companyName,
          ownerName,
          phoneNumber,
          experienceYears,
          specialization,
          serviceAreas,
          description,
          city,
          state,
        } = req.body ?? {};

        if (!ownerName || !phoneNumber || experienceYears === undefined || !specialization) {
          return res.status(400).json({ success: false, message: 'Missing required profile fields' });
        }

        // Resolve the specialization to an active DBC service; there is no fallback service.
        const catalog = findCatalogService(String(specialization)) ?? resolveServices(String(specialization), { limit: 1 })[0]?.service;
        const category = catalog
          ? await db.serviceCategory.findFirst({ where: { slug: catalog.slug, isActive: true, deletedAt: null } })
          : null;
        if (!category) {
          return res.status(400).json({ success: false, message: 'Please choose one of the DBC services as your specialization.' });
        }

        const existing = await db.providerProfile.findUnique({
          where: { userId: user.id },
          select: { categoryId: true, verificationStatus: true },
        });

        let profile;
        if (existing) {
          assertServiceChangeAllowed(existing, category.id);
          // Professionals may edit their own descriptive fields only; verification and featuring stay admin-only.
          profile = await db.providerProfile.update({
            where: { userId: user.id },
            data: {
              fullName: ownerName,
              businessName: companyName,
              phoneNumber,
              experienceYears: Number(experienceYears),
              categoryId: category.id,
              serviceAreas,
              description,
            },
            include: { category: true },
          });
        } else {
          if (!city || !state) {
            return res.status(400).json({ success: false, message: 'City and state are required to create a professional profile.' });
          }
          profile = await db.providerProfile.create({
            data: {
              userId: user.id,
              fullName: ownerName,
              businessName: companyName,
              phoneNumber,
              experienceYears: Number(experienceYears),
              categoryId: category.id,
              serviceAreas,
              description,
              email: user.email,
              city: String(city),
              state: String(state),
              verificationStatus: VerificationStatus.PENDING,
              isFeatured: false,
              isAvailable: true,
            },
            include: { category: true },
          });
        }

        return res.status(200).json({ success: true, data: mapToContractorProfile(profile) });
      } catch (err: unknown) {
        if (err instanceof ServiceChangeError) return res.status(err.status).json({ success: false, code: err.code, message: err.message });
        return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }
}
