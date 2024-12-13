import { body } from "express-validator";

export default [
    body("name")
        .exists()
        .withMessage("Category name is required")
        .isString()
        .withMessage("Category name must be a string"),

    body("priceConfiguaration")
        .exists()
        .withMessage("Price Configuaration is required"),

    body("priceConfiguaration.*.priceType")
        .exists()
        .withMessage("Price Type is required")
        .custom((value: "base" | "aditional") => {
            const validKeys = ["base", "additional"];
            if (!validKeys.includes(value)) {
                throw new Error(`${value} is invalid attribute for priceType`);
            }
        }),

    body("attributes").exists().withMessage("Attributes is required"),
];
