import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import { registerDocs } from "../config/docs.js";
import { errorHandler, notFoundHandler } from "../middlewares/error.js";
import { router } from "../routes/index.js";
import { HttpStatus } from "../utils/http-status.js";

export const app: Express = express();

app.use(express.json());
app.use(cookieParser());

registerDocs(app);

app.get("/api/health", (_req, res) => {
  res.status(HttpStatus.OK).json({ status: "ok" });
});

app.use("/api", router);

app.use(notFoundHandler);

app.use(errorHandler);
