import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import { ProductService } from "./product-service";
import winston from "winston";
import { v4 as uuidv4 } from "uuid";
import {
    Attribute,
    Filter,
    PriceConfiguration,
    Product,
    ProductCreateRequest,
} from "./product-types";
import { FileStorage } from "../common/types/storage";
import { UploadedFile } from "express-fileupload";
import { AuthRequest } from "../common/types";
import { Roles } from "../common/constants";
import mongoose from "mongoose";
import { MessageProducerBroker } from "../common/types/broker";

export class ProductController {
    // Constructor to initialize the ProductController with dependencies
    constructor(
        private productService: ProductService, // Service for product-related operations
        private logger: winston.Logger, // Logger for logging messages
        private storage: FileStorage, // Storage service for handling file uploads
        private broker: MessageProducerBroker, // Message broker for sending messages (e.g., Kafka)
    ) {
        // Bind the `create` method to the current instance to maintain `this` context
        this.create = this.create.bind(this);
    }

    // Method to create a new product
    async create(req: ProductCreateRequest, res: Response, next: NextFunction) {
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

        // Extract product details from the request body
        const {
            name,
            description,
            priceConfiguration,
            attributes,
            tenantId,
            categoryId,
            isPublish,
        } = req.body;

        // Create a product object
        const product = {
            name,
            description,
            priceConfiguration: JSON.parse(
                priceConfiguration,
            ) as PriceConfiguration, // Parse price configuration
            attributes: JSON.parse(attributes) as Attribute, // Parse attributes
            tenantId,
            categoryId,
            isPublish,
            // image: "demo.jpg", // Placeholder for image URL (to be replaced with actual image name)
            image: imageName, // Uncomment to use the uploaded image name
        };

        // Save the product to the database using the product service
        const newProduct = await this.productService.createProduct(
            product as unknown as Product,
        );

        // Send a message to the broker (e.g., Kafka) with product details
        await this.broker.sendMessage(
            "product-topic", // Kafka topic name
            JSON.stringify({
                id: newProduct._id,
                priceConfiguration: newProduct.priceConfiguration,
            }),
        );

        // Log the creation of the new product
        this.logger.info(`New product added`, { id: newProduct._id });

        // Respond with the ID of the newly created product
        res.json({ id: newProduct._id });
    }

    // Method to update an existing product
    update = async (
        req: ProductCreateRequest,
        res: Response,
        next: NextFunction,
    ) => {
        // Validate the request
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }

        // Extract the product ID from the request parameters
        const { productId } = req.params;

        // Fetch the product from the database to check if it exists
        const productFromDB = await this.productService.getProduct(productId);

        if (!productFromDB) {
            return next(createHttpError(404, "Product not Found"));
        }

        // Check if the tenant has access to the product
        const isTenantId = (req as AuthRequest).auth.tenant;

        if ((req as AuthRequest).auth.role !== Roles.ADMIN) {
            if (productFromDB.tenantId !== String(isTenantId)) {
                return next(
                    createHttpError(
                        403,
                        "You are not allowed to access this product",
                    ),
                );
            }
        }

        // Handle image upload if a new image is provided
        let imageName: string | undefined;
        let oldImage: string | undefined;

        if (req.files?.image) {
            oldImage = productFromDB.image; // Store the old image name for deletion

            const image = req.files?.image as UploadedFile;

            imageName = uuidv4(); // Generate a unique filename for the new image

            // Upload the new image to the storage service
            await this.storage.upload({
                fileName: imageName,
                fileData: image.data.buffer,
            });

            // Delete the old image from the storage service
            await this.storage.delete(oldImage);
        }

        // Extract updated product details from the request body
        const {
            name,
            description,
            priceConfiguration,
            attributes,
            tenantId,
            categoryId,
            isPublish,
        } = req.body;

        // Create an updated product object
        const product = {
            name,
            description,
            priceConfiguration: JSON.parse(priceConfiguration) as string,
            attributes: JSON.parse(attributes) as string,
            tenantId,
            categoryId,
            isPublish,
            image: imageName ? imageName : (oldImage as string), // Use the new image name if available, otherwise keep the old one
        };

        // Update the product in the database using the product service
        const updatedProduct = await this.productService.updateProduct(
            productId,
            product,
        );

        // Send a message to the broker with updated product details
        await this.broker.sendMessage(
            "product-topic",
            JSON.stringify({
                id: updatedProduct._id,
                priceConfiguration: updatedProduct.priceConfiguration,
            }),
        );

        // Log the update operation
        this.logger.info("product is updated", { _id: req.params.productId });

        // Respond with the ID of the updated product
        res.json({ id: req.params.productId });
    };

    // Method to fetch a list of products with optional filters and pagination
    index = async (req: Request, res: Response) => {
        // Extract query parameters for filtering and pagination
        const { q, tenantId, categoryId, isPublish } = req.query;

        // Initialize filters object
        const filters: Filter = {};

        // Apply filters based on query parameters
        if (isPublish === "true") {
            filters.isPublish = true;
        }

        if (tenantId) {
            filters.tenantId = tenantId as string;
        }

        if (
            categoryId &&
            mongoose.Types.ObjectId.isValid(categoryId as string)
        ) {
            filters.categoryId = new mongoose.Types.ObjectId(
                categoryId as string,
            );
        }

        // Fetch products from the database using the product service
        const products = await this.productService.getProducts(
            q as string, // Search query
            filters, // Applied filters
            {
                page: req.query.page ? parseInt(req.query.page as string) : 1, // Pagination: page number
                limit: req.query.limit
                    ? parseInt(req.query.limit as string)
                    : 10, // Pagination: number of items per page
            },
        );

        // If no products are found, return an empty response
        if (!products.data) {
            return res.json({
                data: [],
                total: 0,
                pageSize: 10,
                currentPage: 1,
            });
        }

        // Map over the products to include the full image URL from the storage service
        const finalProduct = (products?.data as Product[]).map(
            (product: Product) => {
                return {
                    ...product,
                    image: this.storage.getObject(product.image), // Get the full image URL
                };
            },
        );

        // Log the fetch operation
        this.logger.info("All Products are fetched");

        // Respond with the list of products and pagination details
        res.json({
            data: finalProduct,
            total: products.total,
            pageSize: products.limit,
            currentPage: products.page,
        });
    };

    // Method to fetch a single product by ID
    show = async (req: Request, res: Response, next: NextFunction) => {
        const productId = req.params.productId;

        // Fetch the product from the database using the product service
        const product = await this.productService.getProduct(productId);

        // If the product is not found, return a 404 error
        if (!product) {
            return next(createHttpError(404, "Product not found"));
        }

        // Include the full image URL in the response
        const finalProduct = {
            ...product,
            image: this.storage.getObject(product.image), // Get the full image URL
        } as Product;

        // Log the fetch operation
        this.logger.info("single Product is fetched", { id: productId });

        // Respond with the product details
        res.json(finalProduct);
    };

    // Method to delete a product by ID
    destroy = async (req: Request, res: Response) => {
        const productId = req.params.productId;

        // Fetch the product from the database to get the image name
        const product = await this.productService.getProduct(productId);

        // Delete the associated image from the storage service
        await this.storage.delete(product!.image);

        // Delete the product from the database using the product service
        await this.productService.deleteProduct(productId);

        // Log the deletion operation
        this.logger.info("Product is deleted", { id: productId });

        // Respond with a success message
        res.json({ message: "Product deleted successfully" });
    };
}
/*

    async create(req: ProductCreateRequest, res: Response, next: NextFunction) {
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

        const {
            name,
            description,
            priceConfiguration,
            attributes,
            tenantId,
            categoryId,
            isPublish,
        } = req.body;

        const product = {
            name,
            description,
            priceConfiguration: JSON.parse(
                priceConfiguration,
            ) as PriceConfiguration,
            attributes: JSON.parse(attributes) as Attribute,
            tenantId,
            categoryId,
            isPublish,
            image: "demo.jpg", //image
            // image: imageName,
        };
        const newProduct = await this.productService.createProduct(
            product as unknown as Product,
        );
        //send product to kafka
        //todo: move topic name to the config
        await this.broker.sendMessage(
            "product-topic",
            JSON.stringify({
                id: newProduct._id,
                priceConfiguration: newProduct.priceConfiguration,
            }),
        );
        this.logger.info(`New product added`, { id: newProduct._id });
        res.json({ id: newProduct._id });
    }

    update = async (
        req: ProductCreateRequest,
        res: Response,
        next: NextFunction,
    ) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }
        const { productId } = req.params;

        //check if tenant has access to the product
        const productFromDB = await this.productService.getProduct(productId);

        if (!productFromDB) {
            return next(createHttpError(404, "Product not Found"));
        }

        const isTenantId = (req as AuthRequest).auth.tenant;

        if ((req as AuthRequest).auth.role !== Roles.ADMIN) {
            if (productFromDB.tenantId !== String(isTenantId)) {
                return next(
                    createHttpError(
                        403,
                        "You are not allowed to access this product",
                    ),
                );
            }
        }

        let imageName: string | undefined;
        let oldImage: string | undefined;

        if (req.files?.image) {
            oldImage = productFromDB.image;

            const image = req.files?.image as UploadedFile;

            imageName = uuidv4();

            await this.storage.upload({
                fileName: imageName,
                fileData: image.data.buffer,
            });

            await this.storage.delete(oldImage);
        }
        const {
            name,
            description,
            priceConfiguration,
            attributes,
            tenantId,
            categoryId,
            isPublish,
        } = req.body;

        const product = {
            name,
            description,
            priceConfiguration: JSON.parse(priceConfiguration) as string,
            attributes: JSON.parse(attributes) as string,
            tenantId,
            categoryId,
            isPublish,
            image: imageName ? imageName : (oldImage as string),
        };
        const updatedProduct = await this.productService.updateProduct(
            productId,
            product,
        );

        await this.broker.sendMessage(
            "product-topic",
            JSON.stringify({
                id: updatedProduct._id,
                priceConfiguration: updatedProduct.priceConfiguration,
            }),
        );
        this.logger.info("product is updated", { _id: req.params.productId });
        res.json({ id: req.params.productId });
    };

    index = async (req: Request, res: Response) => {
        const { q, tenantId, categoryId, isPublish } = req.query;
        const filters: Filter = {};

        if (isPublish === "true") {
            filters.isPublish = true;
        }
        // if (isPublish) {
        //     filters.isPublish = isPublish === 'true';
        // }

        if (tenantId) {
            filters.tenantId = tenantId as string;
        }

        if (
            categoryId &&
            mongoose.Types.ObjectId.isValid(categoryId as string)
        ) {
            filters.categoryId = new mongoose.Types.ObjectId(
                categoryId as string,
            );
        }
        const products = await this.productService.getProducts(
            q as string,
            filters,
            {
                page: req.query.page ? parseInt(req.query.page as string) : 1,
                limit: req.query.limit
                    ? parseInt(req.query.limit as string)
                    : 10,
            },
        );

        if (!products.data) {
            return res.json({
                data: [],
                total: 0,
                pageSize: 10,
                currentPage: 1,
            });
        }

        const finalProduct = (products?.data as Product[]).map(
            (product: Product) => {
                return {
                    ...product,
                    image: this.storage.getObject(product.image),
                };
            },
        );
        this.logger.info("All Products are fetched");
        res.json({
            data: finalProduct,
            total: products.total,
            pageSize: products.limit,
            currentPage: products.page,
        });
    };
    show = async (req: Request, res: Response, next: NextFunction) => {
        const productId = req.params.productId;
        const product = await this.productService.getProduct(productId);
        if (!product) {
            return next(createHttpError(404, "Product not found"));
        }
        const finalProduct = {
            ...product,
            image: this.storage.getObject(product.image),
        } as Product;
        this.logger.info("single Product is fetched", { id: productId });
        res.json(finalProduct);
    };

    destroy = async (req: Request, res: Response) => {
        const productId = req.params.productId;
        const product = await this.productService.getProduct(productId);
        await this.storage.delete(product!.image);
        await this.productService.deleteProduct(productId);
        this.logger.info("Product is deleted", { id: productId });
        res.json({ message: "Product deleted successfully" });
    };
}
*/
