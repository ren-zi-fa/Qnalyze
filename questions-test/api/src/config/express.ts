import express, { type Express } from "express";
import { registerDocs } from "@/config/docs.js";

export const app: Express = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

registerDocs(app);
