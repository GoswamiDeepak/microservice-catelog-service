import { NextFunction, Request, Response } from "express";

export class CategoryController {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async create(req: Request, res: Response, next: NextFunction) {
        res.json({ message: "Hello World!" });
    }
}
