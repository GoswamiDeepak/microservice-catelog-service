import express from "express";
import { asyncWrapper } from "../common/utils/asyncHanlder";
import { ToppingController } from "./topping-controller";
import authMiddleware from "../common/middlewares/auth-middleware";
import { canAccess } from "../common/middlewares/canAccess-middleware";
import fileUpload from "express-fileupload";
import { Roles } from "../common/constants";
import createHttpError from "http-errors";
import createToppingValidator from "./create-topping-validator";
import logger from "../config/logger";
import { ToppingService } from "./topping-servies";
import { S3Storage } from "../common/services/S3Storage";
import { createMessageProducerBroker } from "../common/factories/brokerFactory";

const router = express.Router();

const toppingService = new ToppingService();
const storage = new S3Storage();
const broker = createMessageProducerBroker();

const toppingController = new ToppingController(
    toppingService,
    logger,
    storage,
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
    createToppingValidator,
    asyncWrapper(toppingController.create),
);
router.put(
    "/:toppingId",
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
    createToppingValidator,
    asyncWrapper(toppingController.update),
);

router.get("/", asyncWrapper(toppingController.getAll));
router.get("/:toppingId", asyncWrapper(toppingController.getTopping));

export default router;
