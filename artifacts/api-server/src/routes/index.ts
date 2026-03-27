import { Router, type IRouter } from "express";
import healthRouter from "./health";
import propertiesRouter from "./properties";
import analyticsRouter from "./analytics";
import districtsRouter from "./districts";
import authRouter from "./auth";
import listingsRouter from "./listings";
import favoritesRouter from "./favorites";
import serviceProvidersRouter from "./service-providers";
import customerRequestsRouter from "./customer-requests";
import adminUsersRouter from "./admin-users";
import marketersRouter from "./marketers";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/properties", propertiesRouter);
router.use("/analytics", analyticsRouter);
router.use("/districts", districtsRouter);
router.use("/listings", listingsRouter);
router.use("/favorites", favoritesRouter);
router.use("/service-providers", serviceProvidersRouter);
router.use("/customer-requests", customerRequestsRouter);
router.use("/admin/users", adminUsersRouter);
router.use("/marketers", marketersRouter);

export default router;
