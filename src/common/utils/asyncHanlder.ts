import { NextFunction, Request, RequestHandler, Response } from "express";
import createHttpError from "http-errors";

export const asyncWrapper = (requestHandlerFn: RequestHandler) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(requestHandlerFn(req, res, next)).catch((error) => {
            if (error instanceof Error) {
                return next(createHttpError(500, error.message));
            }
            return next(createHttpError(500, "Failed to create category.!"));
        });
    };
};
