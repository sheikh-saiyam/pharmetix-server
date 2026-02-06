import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares";
import { IUser } from "../../types/express";
import { reviewServices } from "./review.service";

const getReviews = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : undefined;

  const reviews = await reviewServices.getReviews(limit ? limit : undefined);

  res.status(200).json({
    success: true,
    message: "Reviews fetched successfully",
    data: reviews,
  });
});

const createReview = asyncHandler(async (req: Request, res: Response) => {
  const { id: customerId } = req.user as IUser;

  const result = await reviewServices.createReview(customerId, req.body);

  res.status(201).json({
    success: true,
    message: "Review created successfully",
    data: result,
  });
});

export const reviewControllers = { getReviews, createReview };
