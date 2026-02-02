import { prisma } from "../lib/prisma";

type ModelName = "category" | "medicine";

interface GenerateSlugInput {
  model: ModelName;
  name?: string;
  slug?: string;
  ignoreId?: string;
}

export const slugify = (text: string) => {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid text for slug generation!");
  }

  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const generateUniqueSlug = async ({
  model,
  name,
  slug,
  ignoreId,
}: GenerateSlugInput): Promise<string> => {
  if (!slug && !name) {
    throw new Error("Either slug or name must be provided!");
  }

  const baseSlug = slugify(slug ?? name!);
  let finalSlug = baseSlug;
  let counter = 1;

  while (true) {
    const exists = await (prisma as any)[model].findFirst({
      where: { slug: finalSlug, ...(ignoreId && { NOT: { id: ignoreId } }) },
      select: { id: true },
    });

    if (!exists) return finalSlug;

    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }
};
