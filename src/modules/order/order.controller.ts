import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares";
import { IUser } from "../../types/express";
import { orderServices } from "./order.service";
import { buildPaginationAndSort } from "../../utils/pagination-sort";

const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;

  const { skip, take, orderBy } = buildPaginationAndSort(req.query);

  const result = await orderServices.getOrders({
    skip,
    take,
    orderBy,
    status: status as string | undefined,
  });

  res.status(200).json({
    success: true,
    message: "Orders fetched successfully!",
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

const getSellerOrders = asyncHandler(async (req: Request, res: Response) => {});

const getCustomerOrders = asyncHandler(async (req: Request, res: Response) => {
  const { id: customerId } = req.user as IUser;

  const { skip, take, orderBy } = buildPaginationAndSort(req.query);

  const result = await orderServices.getCustomerOrders(customerId, {
    skip,
    take,
    orderBy,
  });

  res.status(200).json({
    success: true,
    message: "Orders fetched successfully!",
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

const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id: customerId } = req.user as IUser;

  const result = await orderServices.createOrder(customerId, req.body);

  res.status(201).json({
    success: true,
    message: "Order created successfully!",
    data: result,
  });
});

export const orderControllers = {
  getOrders,
  getSellerOrders,
  getCustomerOrders,
  createOrder,
};
