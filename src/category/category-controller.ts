import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import { Category } from "./category-types";
import { CategoryService } from "./category-service";
import { Logger } from "winston";
export class CategoryController {
    constructor(
        private categoryService: CategoryService,
        private logger: Logger,
    ) {
        this.create = this.create.bind(this);
        this.getAll = this.getAll.bind(this);
        this.getById = this.getById.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
    }

    async create(req: Request, res: Response, next: NextFunction) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }

        const { name, priceConfiguration, attributes } = req.body as Category;

        const category = await this.categoryService.create({
            name,
            priceConfiguration,
            attributes,
        });
        this.logger.info(`Category created`, { id: category._id });

        res.json({ id: category._id });
    }

    async getAll(req: Request, res: Response) {
        const sleep = (ms: number) =>
            new Promise((resolve) => setTimeout(resolve, ms));
        await sleep(10000);
        const categories = await this.categoryService.getAll();
        this.logger.info("Fetched all categories");
        res.json(categories);
    }

    async getById(req: Request, res: Response) {
        const id = req.params.id;
        const category = await this.categoryService.getById(id);
        this.logger.info(`Fetched category with id ${id}`);
        res.json(category);
    }

    async update(req: Request, res: Response, next: NextFunction) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, "Validation failed!", result));
        }
        const id = req.params.id;

        const { name, priceConfiguration, attributes } = req.body as Category;

        const category = await this.categoryService.update(id, {
            name,
            priceConfiguration,
            attributes,
        });
        this.logger.info(`Updated category`, { id });
        res.json({ message: "Category updated successfully!", category });
    }

    async delete(req: Request, res: Response) {
        const id = req.params.id;
        await this.categoryService.delete(id);
        this.logger.info(`Deleted category with id ${id}`);
        res.json({ message: "Category deleted successfully!" });
    }
}
