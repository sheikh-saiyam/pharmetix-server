export interface IReviewPayload {
  rating: number;
  comment: string;
  medicineId: string;
  orderId: string;
}

export interface IGetReviewsQueries {
  skip: number;
  take: number;
  orderBy: { [key: string]: "asc" | "desc" } | undefined;
  rating: number | undefined;
}
