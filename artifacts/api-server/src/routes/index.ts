import { Router, type IRouter } from "express";
import healthRouter from "./health";
import razorpayRouter from "./razorpay";
import authRouter from "./auth";
import productsRouter from "./products";
import ordersRouter from "./orders";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(razorpayRouter);

export default router;
