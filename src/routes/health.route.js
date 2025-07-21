import { Router } from "express";
import healthController from "../controllers/health.controller.js";

const router = Router();

//health check route..
router.get("/health", healthController);

export default router;
