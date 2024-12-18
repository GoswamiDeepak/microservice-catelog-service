import { NextFunction, Response } from "express";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import { ToppingCreateRequest } from "./topping-types";
import { Logger } from "winston";
import { ToppingService } from "./topping-servies";
import { FileStorage } from "../common/types/storage";
import { UploadedFile } from "express-fileupload";
import { v4 as uuidv4 } from "uuid";

export class ToppingController {
    constructor(
        private toppingService: ToppingService,
        private logger: Logger,
        private storage: FileStorage,
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
            image: "new.jpg",
            // image: imageName
        };

        const newTopping = await this.toppingService.create(topping);

        this.logger.info("Topping is created!", { id: newTopping._id });

        res.json({ id: newTopping._id });
    };
}
