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
