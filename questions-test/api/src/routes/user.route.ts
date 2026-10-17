import { Router } from "express";
import { me } from "@/controllers/user.controller.js";
import { requireAuth } from "@/middlewares/auth.js";

export const userRouter: Router = Router();

userRouter.get("/me", requireAuth, me);
