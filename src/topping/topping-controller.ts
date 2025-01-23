import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import {
    Topping,
    ToppingCreateRequest,
    ToppingEvents,
    ToppingFilter,
} from "./topping-types";
import { Logger } from "winston";
import { ToppingService } from "./topping-servies";
import { FileStorage } from "../common/types/storage";
import { UploadedFile } from "express-fileupload";
import { v4 as uuidv4 } from "uuid";
import { AuthRequest } from "../common/types";
import { Roles } from "../common/constants";
import { MessageProducerBroker } from "../common/types/broker";

export class ToppingController {
    // Constructor to initialize the ToppingController with dependencies
    constructor(
        private toppingService: ToppingService, // Service for topping-related operations
        private logger: Logger, // Logger for logging messages
        private storage: FileStorage, // Storage service for handling file uploads
        private broker: MessageProducerBroker, // Message broker for sending messages (e.g., Kafka)
    ) {}

    // Method to create a new topping
    create = async (
        req: ToppingCreateRequest,
        res: Response,
        next: NextFunction,
    ) => {
        // Validate the request using express-validator
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }

        // Handle image upload
        const image = req.files!.image as UploadedFile;
        const imageName = uuidv4(); // Generate a unique filename for the image

        // Upload the image to the storage service
        await this.storage.upload({
            fileName: imageName,
            fileData: image.data.buffer,
        });

        // Extract topping details from the request body
        const { name, price, tenantId, isPublish } = req.body;

        // Create a topping object
        const topping = {
            name,
            price,
            tenantId,
            isPublish,
            image: "new.jpg", // Placeholder for image URL (to be replaced with actual image name)
            // image: imageName, // Use the uploaded image name
        };

        // Save the topping to the database using the topping service
        const newTopping = await this.toppingService.create(topping);

        const brokerMessage = {
            event_type: ToppingEvents.TOPPING_CREATE,
            data: {
                id: newTopping._id,
                price: newTopping.price,
                tenantId: newTopping.tenantId,
            },
        };
        // Send a message to the broker (e.g., Kafka) with topping details
        await this.broker.sendMessage(
            "topping-topic", // Kafka topic name
            JSON.stringify(brokerMessage),
        );

        // Log the creation of the new topping
        this.logger.info("Topping is created!", { id: newTopping._id });

        // Respond with the ID of the newly created topping
        res.json({ id: newTopping._id });
    };

    // Method to update an existing topping
    update = async (
        req: ToppingCreateRequest,
        res: Response,
        next: NextFunction,
    ) => {
        // Validate the request
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }

        // Extract the topping ID from the request parameters
        const { toppingId } = req.params;

        // Fetch the topping from the database to check if it exists
        const topping = await this.toppingService.getTopping(toppingId);

        if (!topping) {
            return next(createHttpError(404, "Topping is not Found."));
        }

        // Check if the tenant has access to the topping
        const isTenantId = (req as AuthRequest).auth.tenant;

        if ((req as AuthRequest).auth.role !== Roles.ADMIN) {
            if (topping.tenantId !== String(isTenantId)) {
                return next(
                    createHttpError(
                        403,
                        "You are not allowed to access this Topping",
                    ),
                );
            }
        }

        // Handle image upload if a new image is provided
        let imageName: string | undefined;
        let oldImage: string | undefined;

        if (req.files?.image) {
            // Store the old image name for deletion
            oldImage = topping.image;

            const originalImage = req.files?.image as UploadedFile;

            // Generate a unique filename for the new image
            imageName = uuidv4();

            // Upload the new image to the storage service
            await this.storage.upload({
                fileName: imageName,
                fileData: originalImage.data.buffer,
            });

            // Delete the old image from the storage service
            await this.storage.delete(oldImage);
        }

        // Extract updated topping details from the request body
        const { name, price, tenantId, isPublish } = req.body;

        // Create an updated topping object
        const toppingData = {
            name,
            price,
            tenantId,
            isPublish,
            image: imageName ? imageName : (oldImage as string), // Use the new image name if available, otherwise keep the old one
        };

        // Update the topping in the database using the topping service
        const updatedTopping = await this.toppingService.updateTopping(
            toppingId,
            toppingData,
        );

        const brokerMessage = {
            event_type: ToppingEvents.TOPPING_UPDATE,
            data: {
                id: updatedTopping!._id,
                price: updatedTopping!.price,
                tenantId: updatedTopping!.tenantId,
            },
        };

        // Send a message to the broker with updated topping details
        await this.broker.sendMessage(
            "topping-topic",
            JSON.stringify(brokerMessage),
        );

        // Log the update operation
        this.logger.info("Topping is updated", { id: toppingId });

        // Respond with a success message (missing in the original code)
        res.json({ id: toppingId });
    };

    // Method to fetch all toppings with optional filtering
    getAll = async (req: Request, res: Response) => {
        // Extract query parameters for filtering
        const { tenantId } = req.query;

        // Initialize filters object
        const filter: ToppingFilter = {};

        // Apply tenant filter if provided
        if (tenantId) {
            filter.tenantId = tenantId as string;
        }

        // Fetch toppings from the database using the topping service
        const topping = await this.toppingService.getAll(filter);

        // Map over the toppings to include the full image URL from the storage service
        const finalTopping = (topping as Topping[]).map((topping: Topping) => {
            return {
                ...topping,
                image: this.storage.getObject(topping.image), // Get the full image URL
            };
        });

        // Log the fetch operation
        this.logger.info("All Topping are fetched");

        // Respond with the list of toppings
        res.json({
            data: finalTopping,
        });
    };

    // Method to fetch a single topping by ID
    getTopping = async (req: Request, res: Response, next: NextFunction) => {
        const toppingId = req.params.toppingId;

        // Fetch the topping from the database using the topping service
        const topping = await this.toppingService.getTopping(toppingId);

        // If the topping is not found, return a 404 error
        if (!topping) {
            return next(createHttpError(404, "Topping not Found"));
        }

        // Include the full image URL in the response
        const finalTopping = {
            ...topping.toObject(),
            image: this.storage.getObject(topping.image), // Get the full image URL
        };

        // Log the fetch operation
        this.logger.info("single Product is fetched", { id: toppingId });

        // Respond with the topping details
        res.json(finalTopping);
    };

    // Method to delete a topping by ID
    delete = async (req: Request, res: Response, next: NextFunction) => {
        const toppingId = req.params.toppingId;

        // Fetch the topping from the database to get the image name
        const toppingData = await this.toppingService.getTopping(toppingId);

        // If the topping is not found, return a 404 error
        if (!toppingData) {
            return next(createHttpError(404, "Topping is not found."));
        }

        // Delete the associated image from the storage service
        await this.storage.delete(toppingData.image);

        // Delete the topping from the database using the topping service
        await this.toppingService.deleteTopping(toppingId);

        // Log the deletion operation
        this.logger.info("Product is deleted", { id: toppingId });

        // Respond with a success message
        res.json({ message: "Topping deleted successfully" });
    };
}
/*
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import { Topping, ToppingCreateRequest, ToppingFilter } from "./topping-types";
import { Logger } from "winston";
import { ToppingService } from "./topping-servies";
import { FileStorage } from "../common/types/storage";
import { UploadedFile } from "express-fileupload";
import { v4 as uuidv4 } from "uuid";
import { AuthRequest } from "../common/types";
import { Roles } from "../common/constants";
import { MessageProducerBroker } from "../common/types/broker";

export class ToppingController {
    constructor(
        private toppingService: ToppingService,
        private logger: Logger,
        private storage: FileStorage,
        private broker: MessageProducerBroker,
    ) {}
    create = async (
        req: ToppingCreateRequest,
        res: Response,
        next: NextFunction,
    ) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }

        //image upload
        const image = req.files!.image as UploadedFile;
        const imageName = uuidv4();

        await this.storage.upload({
            fileName: imageName,
            fileData: image.data.buffer,
        });

        //create topping
        const { name, price, tenantId, isPublish } = req.body;

        const topping = {
            name,
            price,
            tenantId,
            isPublish,
            // image: "new.jpg",
            image: imageName,
        };

        const newTopping = await this.toppingService.create(topping);

        await this.broker.sendMessage(
            "topping-topic",
            JSON.stringify({
                id: newTopping._id,
                price: newTopping.price,
            }),
        );
        this.logger.info("Topping is created!", { id: newTopping._id });

        res.json({ id: newTopping._id });
    };

    update = async (
        req: ToppingCreateRequest,
        res: Response,
        next: NextFunction,
    ) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }
        const { toppingId } = req.params;
        //check if tenant has access to the topping ------------------
        const topping = await this.toppingService.getTopping(toppingId);

        if (!topping) {
            return next(createHttpError(404, "Topping is not Found."));
        }

        const isTenantId = (req as AuthRequest).auth.tenant;

        if ((req as AuthRequest).auth.role !== Roles.ADMIN) {
            if (topping.tenantId !== String(isTenantId)) {
                return next(
                    createHttpError(
                        403,
                        "You are not allowed to access this Topping",
                    ),
                );
            }
        }

        //upload image to S3 ------------------
        let imageName: string | undefined;
        let oldImage: string | undefined;

        if (req.files?.image) {
            //check if image exist
            oldImage = topping.image;
            const originalImage = req.files?.image as UploadedFile;
            imageName = uuidv4();
            //upload new image
            await this.storage.upload({
                fileName: imageName,
                fileData: originalImage.data.buffer,
            });
            //delete image
            await this.storage.delete(oldImage);
        }

        const { name, price, tenantId, isPublish } = req.body;

        const toppingData = {
            name,
            price,
            tenantId,
            isPublish,
            image: imageName ? imageName : (oldImage as string),
            // image: imageName
        };

        const updatedTopping = await this.toppingService.updateTopping(
            toppingId,
            toppingData,
        );

        await this.broker.sendMessage(
            "topping-topic",
            JSON.stringify({
                id: updatedTopping!._id,
                price: updatedTopping!.price,
            }),
        );
        this.logger.info("Topping is updated", { id: toppingId });
    };

    getAll = async (req: Request, res: Response) => {
        const { tenantId } = req.query;
        const filter: ToppingFilter = {};
        if (tenantId) {
            filter.tenantId = tenantId as string;
        }

        const topping = await this.toppingService.getAll(filter);
        const finalTopping = (topping as Topping[]).map((topping: Topping) => {
            return {
                ...topping,
                image: this.storage.getObject(topping.image),
            };
        });
        this.logger.info("All Topping are fetched");
        res.json({
            data: finalTopping,
        });
    };

    getTopping = async (req: Request, res: Response, next: NextFunction) => {
        const toppingId = req.params.toppingId;
        const topping = await this.toppingService.getTopping(toppingId);
        if (!topping) {
            return next(createHttpError(404, "Topping not Found"));
        }
        const finalTopping = {
            ...topping.toObject(),
            image: this.storage.getObject(topping.image),
        };
        this.logger.info("single Product is fetched", { id: toppingId });
        res.json(finalTopping);
    };

    delete = async (req: Request, res: Response, next: NextFunction) => {
        const toppingId = req.params.toppingId;
        const toppingData = await this.toppingService.getTopping(toppingId);
        if (!toppingData) {
            return next(createHttpError(404, "Topping is not found."));
        }
        await this.storage.delete(toppingData.image);
        await this.toppingService.deleteTopping(toppingId);
        this.logger.info("Product is deleted", { id: toppingId });
        res.json({ message: "Topping deleted successfully" });
    };
}
*/
