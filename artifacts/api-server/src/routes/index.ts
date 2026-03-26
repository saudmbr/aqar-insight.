import { Router, type IRouter } from "express";
import healthRouter from "./health";
import propertiesRouter from "./properties";
import analyticsRouter from "./analytics";
import districtsRouter from "./districts";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/properties", propertiesRouter);
router.use("/analytics", analyticsRouter);
router.use("/districts", districtsRouter);

export default router;
