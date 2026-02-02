import { MedicineWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { generateUniqueSlug } from "../../utils/generate-slug";
import { IMedicinePayload, IGetMedicinesQueries } from "./medicine.type";

const getMedicines = async (queries: IGetMedicinesQueries) => {
  const {
    skip,
    take,
    orderBy,
    search,
    isActive,
    manufacturer,
    categoryId,
    priceMin,
    priceMax,
    dosageForm,
  } = queries;

  const whereFilters: MedicineWhereInput = {
    isActive: isActive ?? true,
    AND: [
      // search filters
      {
        ...(search && {
          OR: [
            { brandName: { contains: search, mode: "insensitive" } },
            { genericName: { contains: search, mode: "insensitive" } },
            { manufacturer: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      // attribute filters
      {
        ...(manufacturer && { manufacturer }),
      },
      {
        ...(categoryId && { categoryId }),
      },
      {
        ...(dosageForm && { dosageForm }),
      },
      // price filters
      {
        ...((priceMin !== undefined || priceMax !== undefined) && {
          price: {
            ...(priceMin !== undefined ? { gte: priceMin } : {}),
            ...(priceMax !== undefined ? { lte: priceMax } : {}),
          },
        }),
      },
    ],
  };

  const result = await prisma.medicine.findMany({
    // filters
    where: whereFilters,
    // pagination
    skip: skip,
    take: take,
    // sorting
    ...(orderBy && { orderBy }),
    // includes & omissions
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
    omit: { sellerId: true, categoryId: true },
  });

  const total = await prisma.medicine.count({
    where: whereFilters,
  });

  return { data: result, total };
};

const createMedicine = async (sellerId: string, payload: IMedicinePayload) => {
  const slug = await generateUniqueSlug({
    model: "medicine",
    slug: payload.slug as string,
    name: `generic-${payload.genericName}-brand-${payload.brandName}`,
  });

  // Check if category exists and is active
  const category = await prisma.category.findUnique({
    where: { id: payload.categoryId },
    select: { id: true, isActive: true },
  });

  if (!category) {
    throw new Error("Category not found!");
  }

  if (!category.isActive) {
    throw new Error(
      "Category is not active, can't add medicine to inactive category!",
    );
  }

  // Ensure the expiry date is in the future
  const now = new Date();
  if (new Date(payload.expiryDate) <= now) {
    throw new Error("Expiry date must be a future date!");
  }

  // Price should be > 0
  if (payload.price <= 0) {
    throw new Error("Price must be greater than zero!");
  }

  // Stock quantity should be >= 0
  if (payload.stockQuantity < 0) {
    throw new Error("Stock quantity cannot be negative!");
  }
  const result = await prisma.medicine.create({
    data: { ...payload, sellerId, slug },
  });

  return result;
};

const updateMedicine = async (
  id: string,
  sellerId: string,
  payload: Partial<IMedicinePayload>,
) => {
  const medicine = await prisma.medicine.findUnique({
    where: { id },
    select: {
      id: true,
      genericName: true,
      brandName: true,
      slug: true,
      sellerId: true,
    },
  });

  if (!medicine) {
    throw new Error("Medicine not found!");
  }

  if (medicine.sellerId !== sellerId) {
    throw new Error("Unauthorized: You can only update your own medicines!");
  }

  // Check if category exists and is active
  if (payload.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: payload.categoryId },
      select: { id: true, isActive: true },
    });

    if (!category) {
      throw new Error("Category not found!");
    }

    if (!category.isActive) {
      throw new Error(
        "Category is not active, can't add medicine to inactive category!",
      );
    }
  }

  // Ensure the expiry date is in the future
  const now = new Date();
  if (payload.expiryDate && new Date(payload.expiryDate) <= now) {
    throw new Error("Expiry date must be a future date!");
  }

  // Price should be > 0
  if (payload.price && payload.price <= 0) {
    throw new Error("Price must be greater than zero!");
  }

  // Stock quantity should be >= 0
  if (payload.stockQuantity && payload.stockQuantity < 0) {
    throw new Error("Stock quantity cannot be negative!");
  }

  // Generate new slug if name or slug is being updated
  let slug = medicine.slug;
  if (
    payload.slug ||
    (payload.genericName && payload.genericName !== medicine.genericName) ||
    (payload.brandName && payload.brandName !== medicine.brandName)
  ) {
    slug = await generateUniqueSlug({
      model: "medicine",
      slug: (payload.slug ?? slug) as string,
      name: `generic-${payload.genericName ?? medicine.genericName}-brand-${payload.brandName ?? medicine.brandName}`,
      ignoreId: id,
    });
  }

  const result = await prisma.medicine.update({
    where: { id },
    data: { ...payload, slug },
  });

  return result;
};

// TODO: implement delete medicine service

export const medicineServices = {
  getMedicines,
  createMedicine,
  updateMedicine,
};
