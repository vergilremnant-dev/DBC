import { db } from '../utils/db.js';
import { assertServiceChangeAllowed } from './providerEligibility.js';
import { Role, VerificationStatus } from '@prisma/client';
import { toPublicProviders } from '../utils/publicProvider.js';

export interface ProviderProfileInput {
  fullName: string;
  businessName?: string | null;
  profileImage?: string | null;
  coverImage?: string | null;
  description?: string | null;
  experienceYears: number;
  city: string;
  state: string;
  serviceAreas?: string | null;
  categoryId: number;
  phoneNumber: string;
  email: string;
  canProvideServices?: boolean;
  canProvideConsultation?: boolean;
  consultationFee?: number;
}

export interface ProviderQueryFilters {
  page?: number;
  limit?: number;
  categoryId?: number;
  city?: string;
  search?: string;
  isFeatured?: boolean;
  canProvideServices?: boolean;
  canProvideConsultation?: boolean;
}

export async function listProviders(filters: ProviderQueryFilters) {
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 10;
  const skip = (page - 1) * limit;

  const whereClause: any = {
    verificationStatus: VerificationStatus.VERIFIED, // Public list only shows verified
    user: { status: 'ACTIVE' },
  };

  if (filters.categoryId) {
    whereClause.categoryId = Number(filters.categoryId);
  }

  if (filters.city) {
    whereClause.city = {
      contains: filters.city,
      mode: 'insensitive',
    };
  }

  if (filters.isFeatured !== undefined) {
    whereClause.isFeatured = filters.isFeatured;
  }

  if (filters.canProvideServices !== undefined) {
    whereClause.canProvideServices = filters.canProvideServices;
  }

  if (filters.canProvideConsultation !== undefined) {
    whereClause.canProvideConsultation = filters.canProvideConsultation;
  }

  if (filters.search) {
    whereClause.OR = [
      { fullName: { contains: filters.search, mode: 'insensitive' } },
      { businessName: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [total, data] = await Promise.all([
    db.providerProfile.count({ where: whereClause }),
    db.providerProfile.findMany({
      where: whereClause,
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
  ]);

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    // Public DTO: no login email, user id or phone number.
    data: toPublicProviders(data),
  };
}

export async function getProviderById(id: string) {
  const profile = await db.providerProfile.findUnique({
    where: { id },
    include: {
      user: { select: { status: true } },
      category: true,
      portfolios: true,
      reviews: {
        include: {
          customer: true,
        },
      },
    },
  });

  if (!profile) {
    throw new Error('Provider profile not found');
  }

  return profile;
}

export async function getProviderByUserId(userId: string) {
  const profile = await db.providerProfile.findUnique({
    where: { userId },
    include: {
      category: true,
      portfolios: true,
    },
  });

  return profile;
}

export async function createProviderProfile(userId: string, input: ProviderProfileInput) {
  // 1. Verify user exists and has PROVIDER role
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found');
  }
  if (user.role !== Role.PROVIDER) {
    throw new Error('Forbidden: Only users with PROVIDER role can create provider profiles');
  }

  // 2. Verify unique user profile (one profile per user)
  const existingProfile = await db.providerProfile.findUnique({ where: { userId } });
  if (existingProfile) {
    throw new Error('Provider profile already exists for this user');
  }

  // 3. Validation
  await validateProviderInput(input);

  // 4. Create profile
  return await db.providerProfile.create({
    data: {
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
      email: input.email,
      canProvideServices: input.canProvideServices !== undefined ? Boolean(input.canProvideServices) : true,
      canProvideConsultation: input.canProvideConsultation !== undefined ? Boolean(input.canProvideConsultation) : false,
      consultationFee: input.consultationFee !== undefined ? Number(input.consultationFee) : 0.0,
      verificationStatus: VerificationStatus.PENDING,
      isFeatured: false,
      isAvailable: true,
    },
  });
}

export async function updateProviderProfile(userId: string, input: Partial<ProviderProfileInput>) {
  // 1. Verify profile exists
  const existingProfile = await db.providerProfile.findUnique({ where: { userId } });
  if (!existingProfile) {
    throw new Error('Provider profile not found');
  }
  // A verified professional cannot switch service without DBC re-verification.
  assertServiceChangeAllowed(existingProfile, input.categoryId);

  // 2. Validate inputs
  if (input.experienceYears !== undefined && Number(input.experienceYears) < 0) {
    throw new Error('Experience years cannot be negative');
  }
  if (input.phoneNumber && !/^\+?[0-9]{10,15}$/.test(input.phoneNumber)) {
    throw new Error('Invalid phone number format. Must be 10-15 digits');
  }
  if (input.categoryId) {
    const categoryExists = await db.serviceCategory.findUnique({
      where: { id: Number(input.categoryId) },
    });
    if (!categoryExists) {
      throw new Error('Selected service category does not exist');
    }
  }

  // 3. Update
  return await db.providerProfile.update({
    where: { userId },
    data: {
      fullName: input.fullName,
      businessName: input.businessName,
      profileImage: input.profileImage,
      coverImage: input.coverImage,
      description: input.description,
      experienceYears: input.experienceYears !== undefined ? Number(input.experienceYears) : undefined,
      city: input.city,
      state: input.state,
      serviceAreas: input.serviceAreas,
      categoryId: input.categoryId ? Number(input.categoryId) : undefined,
      phoneNumber: input.phoneNumber,
      email: input.email,
      canProvideServices: input.canProvideServices !== undefined ? Boolean(input.canProvideServices) : undefined,
      canProvideConsultation: input.canProvideConsultation !== undefined ? Boolean(input.canProvideConsultation) : undefined,
      consultationFee: input.consultationFee !== undefined ? Number(input.consultationFee) : undefined,
    },
  });
}

// Admin Operations
export async function adminVerifyProvider(id: string, status: string) {
  if (status !== 'VERIFIED' && status !== 'PENDING' && status !== 'REJECTED') {
    throw new Error('Invalid verification status');
  }

  const profile = await db.providerProfile.findUnique({ where: { id } });
  if (!profile) {
    throw new Error('Provider profile not found');
  }

  return await db.providerProfile.update({
    where: { id },
    data: {
      verificationStatus: status as VerificationStatus,
    },
  });
}

export async function adminFeatureProvider(id: string, isFeatured: boolean) {
  const profile = await db.providerProfile.findUnique({ where: { id } });
  if (!profile) {
    throw new Error('Provider profile not found');
  }

  return await db.providerProfile.update({
    where: { id },
    data: {
      isFeatured,
    },
  });
}

export async function adminUpdateProviderAvailability(id: string, isAvailable: boolean) {
  const profile = await db.providerProfile.findUnique({ where: { id } });
  if (!profile) {
    throw new Error('Provider profile not found');
  }

  return await db.providerProfile.update({
    where: { id },
    data: {
      isAvailable,
    },
  });
}

// Helpers
async function validateProviderInput(input: ProviderProfileInput) {
  if (!input.fullName || input.fullName.trim() === '') {
    throw new Error('Full name is required');
  }
  if (input.experienceYears === undefined || Number(input.experienceYears) < 0) {
    throw new Error('Valid experience years (>= 0) is required');
  }
  if (!input.city || input.city.trim() === '') {
    throw new Error('City is required');
  }
  if (!input.state || input.state.trim() === '') {
    throw new Error('State is required');
  }
  if (!input.categoryId) {
    throw new Error('Service category is required');
  }
  if (!input.phoneNumber || !/^\+?[0-9]{10,15}$/.test(input.phoneNumber)) {
    throw new Error('Invalid phone number format. Must be 10-15 digits');
  }
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    throw new Error('Valid email address is required');
  }

  const categoryExists = await db.serviceCategory.findUnique({
    where: { id: Number(input.categoryId) },
  });
  if (!categoryExists) {
    throw new Error('Selected service category does not exist');
  }
}
