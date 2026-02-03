import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares";
import { IUser } from "../../types/express";
import { orderServices } from "./order.service";

const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id: customerId } = req.user as IUser;

  const result = await orderServices.createOrder(customerId, req.body);

  res.status(201).json({
    success: true,
    message: "Order created successfully!",
    data: result,
  });
});

export const orderControllers = { createOrder };
