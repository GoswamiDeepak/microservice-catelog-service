import { body } from "express-validator";

export default [
    body("name")
        .exists()
        .withMessage("Category name is required")
        .isString()
        .withMessage("Category name must be a string"),

    body("priceConfiguration")
        .exists()
        .withMessage("Price Configuaration is required"),

    body("priceConfiguration.*.priceType")
        .exists()
        .withMessage("Price Type is required")
        .custom((value: "base" | "aditional") => {
            const validKeys = ["base", "aditional"];
            if (!validKeys.includes(value)) {
                throw new Error(`${value} is invalid attribute for priceType`);
            }
            return true;
        }),

    body("attributes").exists().withMessage("Attributes is required"),
];
