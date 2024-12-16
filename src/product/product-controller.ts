import { NextFunction, Response } from "express";
// import { Request } from "express-jwt";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import { ProductService } from "./product-service";
import winston from "winston";
import {
    Attribute,
    PriceConfiguration,
    Product,
    ProductCreateRequest,
} from "./product-types";
import { FileStorage } from "../common/types/storage";
import { v4 as uuidv4 } from "uuid";
import { UploadedFile } from "express-fileupload";

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
}
