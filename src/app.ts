import cors from "cors";
import express, { Express, Request, Response } from "express";
import { errorHandler, logger, notFound } from "./middlewares";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { env } from "./config/env";

const app: Express = express();

app.use(express.json());
app.use(logger);

app.use(
  cors({
    origin: [env.APP_ORIGIN],
    credentials: true,
  }),
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.get("/", (req: Request, res: Response) => {
  res.send("Pharmetix Server Is Running!");
});

app.use(notFound);

app.use(errorHandler);

export default app;
