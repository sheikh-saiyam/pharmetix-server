import { OrderItemStatus, OrderStatus } from "../../../generated/prisma/enums";

export interface IOrderItemPayload {
  medicineId: string;
  quantity: number;
}

export interface IOrderPayload {
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;

  orderItems: IOrderItemPayload[];
}

export interface IGetAllOrdersQueries {
  skip: number;
  take: number;
  orderBy: { [key: string]: "asc" | "desc" } | undefined;
  status: OrderStatus[] | undefined;
}
export interface IGetSellerOrdersQueries {
  skip: number;
  take: number;
  orderBy: { [key: string]: "asc" | "desc" } | undefined;
  status: OrderItemStatus | undefined;
}

export interface IGetCustomerOrdersQueries {
  skip: number;
  take: number;
  orderBy: { [key: string]: "asc" | "desc" } | undefined;
}
