import { db } from '../utils/db.js';
import { assertServiceChangeAllowed } from './providerEligibility.js';
import { Role, VerificationStatus } from '@prisma/client';
import { validateCustomerProfileInput, validateProviderProfileInput } from '../utils/validation.js';
import { storage } from '../utils/storage.js';

export async function getProfile(userId: string, role: Role) {
  if (role === Role.ADMIN) {
    return { id: userId, email: '', role: 'ADMIN', fullName: 'Admin User' };
  }

  if (role === Role.CUSTOMER) {
    return await db.customerProfile.findUnique({
      where: { userId },
    });
  }

  return await db.providerProfile.findUnique({
    where: { userId },
    include: { category: true },
  });
}

export async function upsertCustomerProfile(userId: string, input: any) {
  const errors = validateCustomerProfileInput(input);
  if (errors.length > 0) {
    throw new Error(JSON.stringify({ validationErrors: errors }));
  }

  return await db.customerProfile.upsert({
    where: { userId },
    update: {
      fullName: input.fullName,
      phoneNumber: input.phoneNumber,
      address: input.address,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      profileImageUrl: input.profileImageUrl,
    },
    create: {
      userId,
      fullName: input.fullName,
      phoneNumber: input.phoneNumber,
      address: input.address,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      profileImageUrl: input.profileImageUrl,
    },
  });
}

export async function upsertProviderProfile(userId: string, input: any) {
  const isConsultant = input.canProvideConsultation === true;
  const errors = validateProviderProfileInput(input, isConsultant);
  if (errors.length > 0) {
    throw new Error(JSON.stringify({ validationErrors: errors }));
  }

  const categoryExists = await db.serviceCategory.findUnique({
    where: { id: Number(input.categoryId) },
  });
  if (!categoryExists) {
    throw new Error('Selected service category does not exist');
  }

  // A verified professional cannot switch service without DBC re-verification.
  const existingProvider = await db.providerProfile.findUnique({ where: { userId }, select: { categoryId: true, verificationStatus: true } });
  assertServiceChangeAllowed(existingProvider, input.categoryId);

  const emailUser = await db.user.findUnique({ where: { id: userId } });
  const email = emailUser?.email || '';

  return await db.providerProfile.upsert({
    where: { userId },
    update: {
      fullName: input.fullName,
      businessName: input.businessName,
      profileImage: input.profileImage,
      coverImage: input.coverImage,
      description: input.description,
      experienceYears: Number(input.experienceYears),
      city: input.city,
      state: input.state,
      serviceAreas: input.serviceAreas,
      categoryId: Number(input.categoryId),
      phoneNumber: input.phoneNumber,
      email,
      canProvideServices: input.canProvideServices !== undefined ? Boolean(input.canProvideServices) : true,
      canProvideConsultation: input.canProvideConsultation !== undefined ? Boolean(input.canProvideConsultation) : false,
      consultationFee: input.consultationFee !== undefined ? Number(input.consultationFee) : 0.0,
    },
    create: {
      userId,
      fullName: input.fullName,
      businessName: input.businessName,
      profileImage: input.profileImage,
      coverImage: input.coverImage,
      description: input.description,
      experienceYears: Number(input.experienceYears),
      city: input.city,
      state: input.state,
      serviceAreas: input.serviceAreas,
      categoryId: Number(input.categoryId),
      phoneNumber: input.phoneNumber,
      email,
      canProvideServices: input.canProvideServices !== undefined ? Boolean(input.canProvideServices) : true,
      canProvideConsultation: input.canProvideConsultation !== undefined ? Boolean(input.canProvideConsultation) : false,
      consultationFee: input.consultationFee !== undefined ? Number(input.consultationFee) : 0.0,
      verificationStatus: VerificationStatus.PENDING,
      isFeatured: false,
      isAvailable: true,
    },
    include: { category: true },
  });
}

export async function deleteProfileImage(userId: string, role: Role, field: 'profileImageUrl' | 'profileImage' | 'coverImage') {
  if (role === Role.CUSTOMER) {
    const profile = await db.customerProfile.findUnique({ where: { userId } });
    if (profile?.profileImageUrl) {
      await storage.delete(profile.profileImageUrl);
      await db.customerProfile.update({
        where: { userId },
        data: { profileImageUrl: null },
      });
    }
  } else if (role === Role.PROVIDER) {
    const profile = await db.providerProfile.findUnique({ where: { userId } });
    if (field === 'profileImage' && profile?.profileImage) {
      await storage.delete(profile.profileImage);
      await db.providerProfile.update({
        where: { userId },
        data: { profileImage: null },
      });
    } else if (field === 'coverImage' && profile?.coverImage) {
      await storage.delete(profile.coverImage);
      await db.providerProfile.update({
        where: { userId },
        data: { coverImage: null },
      });
    }
  }
}

export function getProfileCompletion(profile: any, role: Role) {
  if (!profile) {
    return { percentage: 0, missingFields: ['Profile not created yet'] };
  }

  if (role === Role.CUSTOMER) {
    const required = ['fullName', 'phoneNumber', 'city', 'state', 'pincode'];
    const optional = ['address', 'profileImageUrl'];
    return calculateCompletion(profile, required, optional);
  }

  if (role === Role.PROVIDER) {
    const isConsultant = profile.canProvideConsultation === true;
    const required = ['fullName', 'phoneNumber', 'city', 'state', 'experienceYears', 'categoryId'];
    if (isConsultant) {
      required.push('consultationFee');
    }
    const optional = ['businessName', 'profileImage', 'coverImage', 'description', 'serviceAreas'];
    return calculateCompletion(profile, required, optional);
  }

  return { percentage: 100, missingFields: [] };
}

function calculateCompletion(profile: any, requiredKeys: string[], optionalKeys: string[]) {
  const missingFields: string[] = [];
  let filledRequired = 0;
  let filledOptional = 0;

  requiredKeys.forEach((key) => {
    const val = profile[key];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      filledRequired++;
    } else {
      missingFields.push(key);
    }
  });

  optionalKeys.forEach((key) => {
    const val = profile[key];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      filledOptional++;
    }
  });

  const requiredWeight = requiredKeys.length > 0 ? (filledRequired / requiredKeys.length) * 80 : 80;
  const optionalWeight = optionalKeys.length > 0 ? (filledOptional / optionalKeys.length) * 20 : 20;

  return {
    percentage: Math.round(requiredWeight + optionalWeight),
    missingFields,
  };
}
