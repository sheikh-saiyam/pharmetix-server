import {
  CategoryCreateInput,
  CategoryUpdateInput,
} from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { generateUniqueSlug } from "../../utils/generate-slug";

const getCategories = async () => {
  const result = await prisma.category.findMany({
    include: { _count: true },
  });
  return result;
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

export const categoryServices = {
  getCategories,
  createCategory,
  updateCategory,
};
