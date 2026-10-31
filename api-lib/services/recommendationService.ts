import { db } from '../utils/db.js';
import { VerificationStatus } from '@prisma/client';

/**
 * Recommendation Service Layer.
 * Decouples ranking rules from controllers and views, allowing seamless replacement with ML/vector search models.
 */

export async function getTrendingProfessionals(limit: number = 5) {
  return await db.providerProfile.findMany({
    where: {
      verificationStatus: VerificationStatus.VERIFIED,
      user: { status: 'ACTIVE' },
      isAvailable: true,
      averageRating: { gte: 4.0 },
    },
    include: {
      category: true,
    },
    orderBy: [
      { isFeatured: 'desc' },
      { averageRating: 'desc' },
      { totalReviews: 'desc' },
    ],
    take: limit,
  });
}

export async function getMostBookedServices(limit: number = 6) {
  return await db.serviceCategory.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    include: {
      _count: {
        select: { bookings: true },
      },
    },
    orderBy: {
      bookings: {
        _count: 'desc',
      },
    },
    take: limit,
  });
}

export async function getNewlyVerifiedProfessionals(limit: number = 5) {
  return await db.providerProfile.findMany({
    where: {
      verificationStatus: VerificationStatus.VERIFIED,
      user: { status: 'ACTIVE' },
    },
    include: {
      category: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}

export async function getSimilarProfessionals(providerId: string, limit: number = 3) {
  const currentProvider = await db.providerProfile.findUnique({
    where: { id: providerId },
  });

  if (!currentProvider) return [];

  return await db.providerProfile.findMany({
    where: {
      id: { not: providerId },
      verificationStatus: VerificationStatus.VERIFIED,
      user: { status: 'ACTIVE' },
      categoryId: currentProvider.categoryId,
      city: currentProvider.city,
    },
    include: {
      category: true,
    },
    orderBy: [
      { averageRating: 'desc' },
      { experienceYears: 'desc' },
    ],
    take: limit,
  });
}

export async function getRelatedServices(categoryId: number, limit: number = 4) {
  const currentCategory = await db.serviceCategory.findUnique({
    where: { id: categoryId },
  });

  if (!currentCategory) return [];

  // If it has children, return them
  const children = await db.serviceCategory.findMany({
    where: { parentId: categoryId, isActive: true },
    take: limit,
  });

  if (children.length > 0) return children;

  // Otherwise, return sibling categories (with same parent)
  if (currentCategory.parentId) {
    return await db.serviceCategory.findMany({
      where: {
        parentId: currentCategory.parentId,
        id: { not: categoryId },
        isActive: true,
      },
      take: limit,
    });
  }

  // Fallback: return any other featured categories
  return await db.serviceCategory.findMany({
    where: {
      id: { not: categoryId },
      isActive: true,
      isFeatured: true,
    },
    take: limit,
  });
}
