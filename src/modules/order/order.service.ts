import { prisma } from "../../lib/prisma";
import { IOrderPayload } from "./order.type";

const createOrder = async (customerId: string, payload: IOrderPayload) => {
  const {
    shippingName,
    shippingPhone,
    shippingAddress,
    shippingCity,
    shippingPostalCode,
    orderItems,
  } = payload;

  const getMedicines = async () => {
    return Promise.all(
      orderItems.map(async (order) => {
        const result = await prisma.medicine.findUnique({
          where: { id: order.medicineId },
          select: { id: true, sellerId: true, price: true },
        });

        if (!result) {
          throw new Error(`Medicine with ID ${order.medicineId} not found`);
        }

        if (isNaN(order.quantity)) {
          throw new Error(
            `Invalid quantity for medicine ID ${order.medicineId}`,
          );
        }

        const totalPrice = result.price * order.quantity;

        return {
          medicineId: result.id,
          sellerId: result.sellerId,
          quantity: order.quantity,
          unitPrice: result.price,
          subTotal: totalPrice,
        };
      }),
    );
  };

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create order
    const newOrder = await tx.order.create({
      data: {
        customerId,
        totalAmount: 1,
        shippingName,
        shippingPhone,
        shippingAddress,
        shippingCity,
        shippingPostalCode,
      },
      select: { id: true },
    });

    // Prepare order items
    const orderItems = await getMedicines();
    const orderItemsWithOrderId = orderItems.map((order) => {
      return { ...order, orderId: newOrder.id };
    });

    // 2. Create order_items
    await tx.orderItem.createMany({
      data: orderItemsWithOrderId,
    });

    // 3. Get order data
    const orderData = await tx.order.findUnique({
      where: { id: newOrder.id },
      include: {
        orderItems: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            subTotal: true,
            medicineId: true,
          },
        },
      },
    });

    return orderData;
  });

  return result;
};

export const orderServices = { createOrder };
