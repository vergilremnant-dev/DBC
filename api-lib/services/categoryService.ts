import { db } from '../utils/db.js';
import { CategoryType } from '@prisma/client';
import { sortCategoriesForDisplay } from '../utils/serviceCatalog.js';

export interface CategoryInput {
  name: string;
  slug: string;
  categoryType: 'BLUE_COLLAR' | 'WHITE_COLLAR';
  description?: string | null;
  imageUrl?: string | null;
  icon?: string | null;
  parentId?: number | null;
  isActive?: boolean;
  isFeatured?: boolean;
  displayOrder?: number;
}

/** Active categories: white-collar group first, then blue-collar, each in display order. */
export async function getActiveCategories() {
  const rows = await db.serviceCategory.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
  });
  return sortCategoriesForDisplay(rows);
}

export async function getCategoryTree() {
  return await db.serviceCategory.findMany({
    where: {
      parentId: null,
      isActive: true,
      deletedAt: null,
    },
    include: {
      children: {
        where: {
          isActive: true,
          deletedAt: null,
        },
        orderBy: { displayOrder: 'asc' },
        include: {
          children: {
            where: {
              isActive: true,
              deletedAt: null,
            },
            orderBy: { displayOrder: 'asc' },
          },
        },
      },
    },
    orderBy: { displayOrder: 'asc' },
  });
}

export async function getFeaturedCategories() {
  return await db.serviceCategory.findMany({
    where: {
      isFeatured: true,
      isActive: true,
      deletedAt: null,
    },
    orderBy: { displayOrder: 'asc' },
  });
}

/** Looks up by slug, or by numeric id (the route is /api/categories/:slugOrId). */
export async function getCategoryBySlug(slug: string) {
  return await db.serviceCategory.findFirst({
    where: /^\d+$/.test(slug) ? { id: Number(slug), deletedAt: null } : { slug, deletedAt: null },
    include: {
      children: {
        where: { isActive: true, deletedAt: null },
        orderBy: { displayOrder: 'asc' },
      },
    },
  });
}

export async function createCategory(input: CategoryInput) {
  validateCategoryInput(input);

  const existingName = await db.serviceCategory.findUnique({
    where: { name: input.name },
  });
  if (existingName) {
    throw new Error('Category name already exists');
  }

  const existingSlug = await db.serviceCategory.findUnique({
    where: { slug: input.slug },
  });
  if (existingSlug) {
    throw new Error('Category slug already exists');
  }

  if (input.parentId) {
    const parentExists = await db.serviceCategory.findUnique({
      where: { id: input.parentId },
    });
    if (!parentExists) {
      throw new Error('Specified parent category does not exist');
    }
  }

  return await db.serviceCategory.create({
    data: {
      name: input.name,
      slug: input.slug,
      categoryType: input.categoryType as CategoryType,
      description: input.description,
      imageUrl: input.imageUrl,
      icon: input.icon,
      parentId: input.parentId,
      isActive: input.isActive !== undefined ? input.isActive : true,
      isFeatured: input.isFeatured !== undefined ? input.isFeatured : false,
      displayOrder: input.displayOrder !== undefined ? input.displayOrder : 0,
    },
  });
}

export async function updateCategory(id: number, input: Partial<CategoryInput>) {
  const existingCategory = await db.serviceCategory.findUnique({
    where: { id },
  });
  if (!existingCategory) {
    throw new Error('Category not found');
  }

  if (input.categoryType) {
    validateCategoryType(input.categoryType);
  }
  if (input.name && input.name === '') {
    throw new Error('Category name cannot be blank');
  }
  if (input.slug && input.slug === '') {
    throw new Error('Category slug cannot be blank');
  }

  if (input.name && input.name !== existingCategory.name) {
    const conflictName = await db.serviceCategory.findUnique({
      where: { name: input.name },
    });
    if (conflictName) {
      throw new Error('Category name already exists');
    }
  }

  if (input.slug && input.slug !== existingCategory.slug) {
    const conflictSlug = await db.serviceCategory.findUnique({
      where: { slug: input.slug },
    });
    if (conflictSlug) {
      throw new Error('Category slug already exists');
    }
  }

  if (input.parentId) {
    if (input.parentId === id) {
      throw new Error('Category cannot be its own parent');
    }
    const parentExists = await db.serviceCategory.findUnique({
      where: { id: input.parentId },
    });
    if (!parentExists) {
      throw new Error('Specified parent category does not exist');
    }
  }

  return await db.serviceCategory.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      categoryType: input.categoryType ? (input.categoryType as CategoryType) : undefined,
      description: input.description,
      imageUrl: input.imageUrl,
      icon: input.icon,
      parentId: input.parentId !== undefined ? input.parentId : undefined,
      isActive: input.isActive,
      isFeatured: input.isFeatured,
      displayOrder: input.displayOrder,
    },
  });
}

export async function reorderCategories(orders: { id: number; displayOrder: number }[]) {
  const updates = orders.map((o) =>
    db.serviceCategory.update({
      where: { id: o.id },
      data: { displayOrder: o.displayOrder },
    })
  );
  return await db.$transaction(updates);
}

export async function deleteCategory(id: number) {
  const existingCategory = await db.serviceCategory.findUnique({
    where: { id },
  });
  if (!existingCategory) {
    throw new Error('Category not found');
  }

  return await db.serviceCategory.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
}

export async function restoreCategory(id: number) {
  const existingCategory = await db.serviceCategory.findUnique({
    where: { id },
  });
  if (!existingCategory) {
    throw new Error('Category not found');
  }

  return await db.serviceCategory.update({
    where: { id },
    data: { deletedAt: null, isActive: true },
  });
}

function validateCategoryInput(input: CategoryInput) {
  if (!input.name || input.name.trim() === '') {
    throw new Error('Category name is required');
  }
  if (!input.slug || input.slug.trim() === '') {
    throw new Error('Category slug is required');
  }
  if (!input.categoryType) {
    throw new Error('Category type is required');
  }
  validateCategoryType(input.categoryType);
}

function validateCategoryType(type: string) {
  if (type !== 'BLUE_COLLAR' && type !== 'WHITE_COLLAR') {
    throw new Error('Invalid category type. Must be BLUE_COLLAR or WHITE_COLLAR');
  }
}
