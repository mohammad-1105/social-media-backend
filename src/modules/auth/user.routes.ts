import { Router } from "express";

import { validateRequest } from "@/shared/middlewares/validate.middleware.js";

import { registerSchema } from "./dto/auth.dto.js";
import { userController } from "./user.controller.js";

const router = Router();

// Public routes
router.post("/register", validateRequest({ body: registerSchema }), userController.register);

export default router;
