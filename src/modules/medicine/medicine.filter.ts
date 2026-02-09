import { MedicineWhereInput } from "../../../generated/prisma/models";
import { IGetMedicinesQueries } from "./medicine.type";

const buildMedicinesWhere = (payload: IGetMedicinesQueries) => {
  const {
    search,
    isActive,
    manufacturer,
    categoryId,
    priceMin,
    priceMax,
    dosageForm,
  } = payload;

  return {
    isActive: isActive ?? true,
    isDeleted: false,
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
  } as MedicineWhereInput;
};

export { buildMedicinesWhere };
