import cors from "cors";
import express, { Express, Request, Response } from "express";
import logger from "./middlewares/logger";
import errorHandler from "./middlewares/error-handler";

const app: Express = express();

app.use(express.json());
app.use(logger);

app.use(
  cors({
    origin: [process.env.DEV_APP_ORIGIN!, process.env.PROD_APP_ORIGIN!],
    credentials: true,
  }),
);

app.use(errorHandler);

app.get("/", (req: Request, res: Response) => {
  res.send("Pharmetix Server Is Running!");
});

export default app;
