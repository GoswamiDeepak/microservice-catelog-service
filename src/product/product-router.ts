import express from "express";
import authMiddleware from "../common/middlewares/auth-middleware";
import { canAccess } from "../common/middlewares/canAccess-middleware";
import { asyncWrapper } from "../common/utils/asyncHanlder";
import { Roles } from "../common/constants";
import createProductValidator from "./create-product-validator";
import { ProductController } from "./product-controller";
import logger from "../config/logger";
import { ProductService } from "./product-service";
import fileUpload from "express-fileupload";
import { S3Storage } from "../common/services/S3Storage";
import createHttpError from "http-errors";
import updateProductValidator from "./update-product-validator";
import { createMessageProducerBroker } from "../common/factories/brokerFactory";

const router = express.Router();

const productService = new ProductService();
const s3Storage = new S3Storage();
const broker = createMessageProducerBroker();

const productController = new ProductController(
    productService,
    logger,
    s3Storage,
    broker,
);

router.post(
    "/",
    authMiddleware,
    canAccess([Roles.ADMIN, Roles.MANAGER]),
    fileUpload({
        limits: { fileSize: 500 * 1024 },
        abortOnLimit: true,
        limitHandler: (req, res, next) => {
            const error = createHttpError(400, "File size exceeds the limit");
            next(error);
        },
    }),
    createProductValidator,
    asyncWrapper(productController.create),
);

router.put(
    "/:productId",
    authMiddleware,
    canAccess([Roles.ADMIN, Roles.MANAGER]),
    fileUpload({
        limits: { fileSize: 500 * 1024 },
        abortOnLimit: true,
        limitHandler: (req, res, next) => {
            const error = createHttpError(400, "File size exceeds the limit");
            next(error);
        },
    }),
    updateProductValidator,
    asyncWrapper(productController.update),
);

router.get("/", asyncWrapper(productController.index));

router.get("/:productId", asyncWrapper(productController.show));
router.delete("/:productId", asyncWrapper(productController.destroy));

export default router;
