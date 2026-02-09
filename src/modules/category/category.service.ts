import {
  CategoryCreateInput,
  CategoryUpdateInput,
  CategoryWhereInput,
} from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { generateUniqueSlug } from "../../utils/generate-slug";
import { IGetCategoriesQueries } from "./category.type";

const getCategories = async (queries: IGetCategoriesQueries) => {
  const { skip, take, orderBy, search, isFeatured } = queries;

  const whereFilters: CategoryWhereInput = {
    isDeleted: false,
    isActive: true,
    AND: [
      // search filters
      {
        ...(search && {
          OR: [
            { slug: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      // attribute filters
      {
        ...(isFeatured && { isFeatured }),
      },
    ],
  };

  const result = await prisma.category.findMany({
    // filters
    where: whereFilters,
    // pagination
    skip: skip,
    take: take,
    // sorting
    ...(orderBy && { orderBy }),
    // includes & omissions
    include: { _count: true },
    omit: { isDeleted: true, deletedAt: true },
  });

  const total = await prisma.category.count({
    where: whereFilters,
  });

  return { data: result, total };
};

const createCategory = async (payload: CategoryCreateInput) => {
  const slug = await generateUniqueSlug({
    model: "category",
    name: payload.name,
    slug: payload.slug,
  });

  const result = await prisma.category.create({
    data: { ...payload, slug },
  });

  return result;
};

const updateCategory = async (id: string, payload: CategoryUpdateInput) => {
  const category = await prisma.category.findUnique({
    where: { id },
    select: { id: true, slug: true, name: true },
  });

  if (!category) {
    throw new Error("Category not found!");
  }

  let slug = category.slug;
  if (payload.slug || (payload.name && payload.name !== category.name)) {
    slug = await generateUniqueSlug({
      model: "category",
      slug: (payload.slug ?? payload.name ?? category.name) as string,
      ignoreId: id,
    });
  }

  const result = await prisma.category.update({
    where: { id },
    data: { ...payload, slug },
  });

  return result;
};

const deleteCategory = async (id: string) => {
  await prisma.$transaction(async (tx) => {
    const medicines = await tx.category.findUnique({
      where: { id },
      select: { id: true, _count: { select: { medicines: true } } },
    });

    if (!medicines) {
      throw new Error("Category not found!");
    }

    const hasMedicines = medicines?._count.medicines > 0;

    if (hasMedicines) {
      throw new Error(
        "Can't delete category with associated medicines, delete or move them first!",
      );
    }

    await tx.category.update({
      where: { id },
      data: { isActive: false, isDeleted: true, deletedAt: new Date() },
    });
  });
};

export const categoryServices = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
