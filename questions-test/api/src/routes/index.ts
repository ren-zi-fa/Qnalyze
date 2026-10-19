import { Router } from "express";
import { attemptRouter } from "./attempt.route.js";
import { authRouter } from "./auth.route.js";
import { categoryRouter } from "./category.route.js";
import { questionRouter } from "./question.route.js";
import { userRouter } from "./user.route.js";

export const router: Router = Router();

router.use("/attempts", attemptRouter);
router.use("/auth", authRouter);
router.use("/categories", categoryRouter);
router.use("/questions", questionRouter);
router.use("/users", userRouter);
