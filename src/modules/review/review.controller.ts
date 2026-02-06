import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares";
import { IUser } from "../../types/express";
import { reviewServices } from "./review.service";
import { buildPaginationAndSort } from "../../utils/pagination-sort";

const getReviews = asyncHandler(async (req: Request, res: Response) => {
  const limitParam = req.query.limit ? Number(req.query.limit) : undefined;
  const limit =
    limitParam !== undefined && !Number.isNaN(limitParam) && limitParam >= 0
      ? limitParam
      : undefined;

  const reviews = await reviewServices.getReviews(limit);
  res.status(200).json({
    success: true,
    message: "Reviews fetched successfully",
    data: reviews,
  });
});

const getAllReviews = asyncHandler(async (req: Request, res: Response) => {
  const { rating } = req.query;

  const { skip, take, orderBy } = buildPaginationAndSort(req.query);

  const numericRating = Number(rating) || undefined;

  const result = await reviewServices.getAllReviews({
    skip: skip,
    take: take,
    orderBy: orderBy,
    rating: numericRating,
  });

  res.status(200).json({
    success: true,
    message: "All reviews fetched successfully",
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

const createReview = asyncHandler(async (req: Request, res: Response) => {
  const { id: customerId } = req.user as IUser;

  const result = await reviewServices.createReview(customerId, req.body);

  res.status(201).json({
    success: true,
    message: "Review created successfully",
    data: result,
  });
});

export const reviewControllers = { getReviews, getAllReviews, createReview };
