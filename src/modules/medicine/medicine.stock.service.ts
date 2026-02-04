import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { IStockOperation } from "./medicine.type";

const updateMedicineStock = async (
  medicineId: string,
  stockOperation: IStockOperation,
  stockQuantity: number,
  tx?: Prisma.TransactionClient,
) => {
  if (stockQuantity <= 0) {
    throw new Error("Stock quantity must be a positive number");
  }

  const result = await (tx ?? prisma).medicine.update({
    where: { id: medicineId },
    data: {
      ...(stockOperation === "INC"
        ? { stockQuantity: { increment: Number(stockQuantity) } }
        : { stockQuantity: { decrement: Number(stockQuantity) } }),
    },
    select: { id: true, stockQuantity: true },
  });

  return result;
};

export const medicineStockServices = {
  updateMedicineStock,
};
