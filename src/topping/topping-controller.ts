import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import { Topping, ToppingCreateRequest } from "./topping-types";
import { Logger } from "winston";
import { ToppingService } from "./topping-servies";
import { FileStorage } from "../common/types/storage";
import { UploadedFile } from "express-fileupload";
import { v4 as uuidv4 } from "uuid";
import { AuthRequest } from "../common/types";
import { Roles } from "../common/constants";

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

        await this.toppingService.updateTopping(toppingId, toppingData);
        this.logger.info("Topping is updated", { id: toppingId });
    };

    getAll = async (req: Request, res: Response) => {
        const topping = await this.toppingService.getAll();
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
