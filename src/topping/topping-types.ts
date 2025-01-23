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

export interface ToppingFilter {
    tenantId?: string;
}

export enum ToppingEvents {
    TOPPING_CREATE = "TOPPING_CREATE",
    TOPPING_UPDATE = "TOPPING_UPDATE",
    TOPPING_DELETE = "TOPPING_DELETE",
}
