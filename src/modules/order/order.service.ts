import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { medicineStockServices } from "../medicine/medicine.stock.service";
import { IStockOperation } from "../medicine/medicine.type";
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

  const getMedicines = async (tx: Prisma.TransactionClient) => {
    return Promise.all(
      orderItems.map(async (order) => {
        const result = await tx.medicine.findUnique({
          where: { id: order.medicineId },
          select: {
            id: true,
            sellerId: true,
            price: true,
            stockQuantity: true,
          },
        });

        if (!result) {
          throw new Error(`Medicine with ID ${order.medicineId} not found`);
        }

        if (isNaN(order.quantity)) {
          throw new Error(
            `Invalid quantity for medicine ID ${order.medicineId}`,
          );
        }

        if (order.quantity > result.stockQuantity) {
          throw new Error(
            `Insufficient stock for medicine ID ${order.medicineId}`,
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
    const orderItems = await getMedicines(tx);

    // Calculate total amount
    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.subTotal,
      0,
    );

    // 1. Create order
    const newOrder = await tx.order.create({
      data: {
        customerId,
        totalAmount,
        shippingName,
        shippingPhone,
        shippingAddress,
        shippingCity,
        shippingPostalCode,
      },
      select: { id: true },
    });

    // Prepare order items
    const orderItemsWithOrderId = orderItems.map((order) => {
      return { ...order, orderId: newOrder.id };
    });

    // 2. Create order_items
    await tx.orderItem.createMany({
      data: orderItemsWithOrderId,
    });

    // 3. Decrease medicine stock
    await Promise.all(
      orderItemsWithOrderId.map((order) =>
        medicineStockServices.updateMedicineStock(
          order.medicineId,
          IStockOperation.DEC,
          order.quantity,
          tx,
        ),
      ),
    );

    // 4. Get order data
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
