import express from "express";
import { CategoryController } from "./category-controller";
import categoryValidator from "./category-validator";
import { CategoryService } from "./category-service";
import logger from "../config/logger";
import { asyncWrapper } from "../common/utils/asyncHanlder";
import authMiddleware from "../common/middlewares/auth-middleware";
import { canAccess } from "../common/middlewares/canAccess-middleware";
import { Roles } from "../common/constants";

const router = express.Router();

const categoryService = new CategoryService();
const categoryController = new CategoryController(categoryService, logger);

router.post(
    "/",
    authMiddleware,
    canAccess([Roles.ADMIN]),
    categoryValidator,
    asyncWrapper(categoryController.create),
);

router.get("/", asyncWrapper(categoryController.getAll));

router.get("/:id", asyncWrapper(categoryController.getById));

router.put(
    "/:id",
    authMiddleware,
    canAccess([Roles.ADMIN]),
    categoryValidator,
    asyncWrapper(categoryController.update),
);

router.delete(
    "/:id",
    authMiddleware,
    canAccess([Roles.ADMIN]),
    asyncWrapper(categoryController.delete),
);

export default router;
