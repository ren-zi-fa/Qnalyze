import { Router } from "express";
import { authRouter } from "./auth.route.js";
import { questionRouter } from "./question.route.js";
import { userRouter } from "./user.route.js";

export const router: Router = Router();

router.use("/auth", authRouter);
router.use("/questions", questionRouter);
router.use("/users", userRouter);
