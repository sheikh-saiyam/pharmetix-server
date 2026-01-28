import cors from "cors";
import express, { Express, Request, Response } from "express";
import { errorHandler, logger, notFound } from "./middlewares";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";

const app: Express = express();

app.use(express.json());
app.use(logger);

app.use(
  cors({
    origin: [process.env.DEV_APP_ORIGIN!, process.env.PROD_APP_ORIGIN!],
    credentials: true,
  }),
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(notFound);

app.use(errorHandler);

app.get("/", (req: Request, res: Response) => {
  res.send("Pharmetix Server Is Running!");
});

export default app;
