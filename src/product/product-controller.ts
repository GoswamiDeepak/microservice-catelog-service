import { NextFunction, Request, Response } from "express";
// import { Request } from "express-jwt";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import { ProductService } from "./product-service";
import winston from "winston";
import {
    Attribute,
    Filter,
    PriceConfiguration,
    Product,
    ProductCreateRequest,
} from "./product-types";
import { FileStorage } from "../common/types/storage";
import { v4 as uuidv4 } from "uuid";
import { UploadedFile } from "express-fileupload";
import { AuthRequest } from "../common/types";
import { Roles } from "../common/constants";
import mongoose from "mongoose";

export class ProductController {
    constructor(
        private productService: ProductService,
        private logger: winston.Logger,
        private storage: FileStorage,
    ) {
        this.create = this.create.bind(this);
    }

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
            // image : 'demo.jpg' //image
            image: imageName,
        };
        const newProduct = await this.productService.createProduct(
            product as unknown as Product,
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
        await this.productService.updateProduct(productId, product);
        res.json({ id: req.params.productId });
    };

    index = async (req: Request, res: Response) => {
        const { q, tenantId, categoryId, isPublish } = req.query;

        const filters: Filter = {};

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
