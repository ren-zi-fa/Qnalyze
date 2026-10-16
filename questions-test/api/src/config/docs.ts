import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Express, Request, Response } from "express";
import express from "express";

const require = createRequire(import.meta.url);
const redoc = require("redoc-express") as (options: {
  title: string;
  specUrl: string;
}) => (req: Request, res: Response) => void;

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const openapiDir = path.resolve(currentDir, "../../openapi");

export function registerDocs(app: Express): void {
  app.use("/openapi", express.static(openapiDir));

  app.get("/openapi.yaml", (_req, res) => {
    res.redirect("/openapi/openapi.yaml");
  });

  app.get(
    "/docs",
    redoc({
      title: "Qnalyze Questions Test API",
      specUrl: "/openapi/openapi.yaml",
    }),
  );
}
