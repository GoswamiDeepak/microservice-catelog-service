import { Request } from "express";

export interface Topping {
    name: string;
    image: string;
    price: string;
    tenantId: string;
    isPublish: boolean;
}

export interface ToppingCreateRequest extends Request {
    body: Topping;
}
