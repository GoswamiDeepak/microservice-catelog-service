import { Request } from "express";

export interface Product {
    name: string;
    description: string;
    priceConfiguration: string;
    attributes: string;
    tenantId: string;
    categoryId: string;
    image: string;
    isPublish?: boolean;
}

export interface PriceConfiguration {
    [key: string]: {
        priceType: "base" | "aditional";
        availableOptions: {
            [key: string]: number;
        };
    };
}

export interface Attribute {
    name: string;
    value: boolean | string;
}

export interface ProductCreateRequest extends Request {
    body: Product;
}
