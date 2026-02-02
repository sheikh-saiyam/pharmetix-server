import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares";
import { categoryServices } from "./category.service";

const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const result = await categoryServices.getCategories();
  res.json({
    success: true,
    message: "Categories retrieved successfully!",
    data: result,
  });
});

const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const result = await categoryServices.createCategory(req.body);
  res.json({
    success: true,
    message: "Category created successfully!",
    data: result,
  });
});

const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await categoryServices.updateCategory(id as string, req.body);

  res.json({
    success: true,
    message: "Category updated successfully!",
    data: result,
  });
});

export const categoryControllers = {
  getCategories,
  createCategory,
  updateCategory,
};
