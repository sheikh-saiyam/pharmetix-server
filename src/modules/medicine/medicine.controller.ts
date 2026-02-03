import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares";
import { IUser } from "../../types/express";
import { medicineServices } from "./medicine.service";
import { buildPaginationAndSort } from "../../utils/pagination-sort";
import { DosageForm } from "../../../generated/prisma/enums";

const getMedicines = asyncHandler(async (req: Request, res: Response) => {
  const {
    search,
    isActive,
    manufacturer,
    categoryId,
    priceMin,
    priceMax,
    dosageForm,
  } = req.query;

  const { skip, take, orderBy } = buildPaginationAndSort(req.query);

  const result = await medicineServices.getMedicines({
    skip,
    take,
    orderBy,
    search: search as string | undefined,
    manufacturer: manufacturer as string | undefined,
    categoryId: categoryId as string | undefined,
    priceMin: priceMin ? Number(priceMin) : undefined,
    priceMax: priceMax ? Number(priceMax) : undefined,
    dosageForm: dosageForm as DosageForm | undefined,
    isActive:
      isActive === "false"
        ? false
        : isActive === "true" || (isActive === undefined && true),
  });

  res.status(200).json({
    success: true,
    message: "Medicines retrieved successfully!",
    meta: {
      total: result.total,
      page: Math.ceil(skip / take) + 1,
      totalPages: Math.ceil(result.total / take),
      limit: take,
      skip: skip,
    },
    data: result.data,
  });
});

const getSellerMedicines = asyncHandler(async (req: Request, res: Response) => {
  const {
    search,
    isActive,
    manufacturer,
    categoryId,
    priceMin,
    priceMax,
    dosageForm,
  } = req.query;

  const { id: sellerId } = req.user as IUser;

  const { skip, take, orderBy } = buildPaginationAndSort(req.query);

  const result = await medicineServices.getSellerMedicines(
    {
      skip,
      take,
      orderBy,
      search: search as string | undefined,
      manufacturer: manufacturer as string | undefined,
      categoryId: categoryId as string | undefined,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      dosageForm: dosageForm as DosageForm | undefined,
      isActive:
        isActive === "false"
          ? false
          : isActive === "true" || (isActive === undefined && true),
    },
    sellerId,
  );

  res.status(200).json({
    success: true,
    message: "Seller Medicines retrieved successfully!",
    meta: {
      total: result.total,
      page: Math.ceil(skip / take) + 1,
      totalPages: Math.ceil(result.total / take),
      limit: take,
      skip: skip,
    },
    data: result.data,
  });
});

const getMedicineById = asyncHandler(async (req: Request, res: Response) => {
  const { identifier } = req.params;

  const result = await medicineServices.getMedicineById(identifier as string);

  res.status(200).json({
    success: true,
    message: "Medicine retrieved successfully!",
    data: result,
  });
});

const createMedicine = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.user as IUser;

  const result = await medicineServices.createMedicine(id, req.body);

  res.status(201).json({
    success: true,
    message: "Medicine created successfully",
    data: result,
  });
});

const updateMedicine = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { id: sellerId } = req.user as IUser;

  const result = await medicineServices.updateMedicine(
    id as string,
    sellerId,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Medicine updated successfully",
    data: result,
  });
});

export const medicineControllers = {
  getMedicines,
  getSellerMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
};
