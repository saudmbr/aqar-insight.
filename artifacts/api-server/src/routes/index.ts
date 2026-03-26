import { Router, type IRouter } from "express";
import healthRouter from "./health";
import propertiesRouter from "./properties";
import analyticsRouter from "./analytics";
import districtsRouter from "./districts";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/properties", propertiesRouter);
router.use("/analytics", analyticsRouter);
router.use("/districts", districtsRouter);

export default router;
