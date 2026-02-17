import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares";
import { statsServices } from "./stats.service";
import { IUser } from "../../types/express";

const getAdminStats = asyncHandler(async (req: Request, res: Response) => {
  const result = await statsServices.getAdminStats();

  res.status(200).json({
    success: true,
    message: "Admin statistics retrieved successfully",
    data: result,
  });
});

const getSellerStats = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.user as IUser;

  const result = await statsServices.getSellerStats(id);

  res.status(200).json({
    success: true,
    message: "Seller statistics retrieved successfully",
    data: result,
  });
});

export const statsControllers = {
  getAdminStats,
  getSellerStats,
};
