import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares";
import { IUser } from "../../types/express";
import { orderServices } from "./order.service";
import { buildPaginationAndSort } from "../../utils/pagination-sort";
import { OrderItemStatus, OrderStatus } from "../../../generated/prisma/enums";

const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;

  const { skip, take, orderBy } = buildPaginationAndSort(req.query);

  const result = await orderServices.getOrders({
    skip,
    take,
    orderBy,
    status: status?.length
      ? ((status as string).split(",") as OrderStatus[] | undefined)
      : undefined,
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

const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { id: customerId, role: customerRole } = req.user as IUser;

  const result = await orderServices.getOrderById(
    orderId as string,
    customerId,
    customerRole,
  );

  res.status(200).json({
    success: true,
    message: "Order fetched successfully!",
    data: result,
  });
});

const getSellerOrders = asyncHandler(async (req: Request, res: Response) => {
  const { id: sellerId } = req.user as IUser;

  const { status } = req.query;

  const { skip, take, orderBy } = buildPaginationAndSort(req.query);

  const result = await orderServices.getSellerOrders(sellerId, {
    skip,
    take,
    orderBy,
    status: status as OrderItemStatus | undefined,
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

const changeOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { status } = req.body || {};

  if (!status) {
    throw new Error("Order status is required!");
  }

  const result = await orderServices.changeOrderStatus(
    orderId as string,
    status,
  );

  res.status(200).json({
    success: true,
    message: "Order status changed successfully!",
    data: result,
  });
});

const changeOrderItemStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { orderItemId } = req.params;
    const { id: sellerId, role } = req.user as IUser;

    const { status } = req.body || {};

    if (!status) {
      throw new Error("Order item status is required!");
    }
    const result = await orderServices.changeOrderItemStatus(
      sellerId,
      role,
      orderItemId as string,
      status,
    );

    res.status(200).json({
      success: true,
      message: "Order item status changed successfully!",
      data: result,
    });
  },
);

const cancelCustomerOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: customerId } = req.user as IUser;
    const { orderId } = req.params;

    const result = await orderServices.cancelCustomerOrder(
      customerId,
      orderId as string,
    );

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully!",
      data: result,
    });
  },
);

export const orderControllers = {
  getOrders,
  getOrderById,
  getSellerOrders,
  getCustomerOrders,
  createOrder,
  changeOrderStatus,
  changeOrderItemStatus,
  cancelCustomerOrder,
};
