import { body } from "express-validator";

export default [
    body("name")
        .exists()
        .withMessage("Product name is required")
        .isString()
        .withMessage("Product name must be a string"),

    body("description").exists().withMessage("Description is required"),

    body("image").custom((value, { req }) => {
        if (!req.files) throw new Error("Product Image is required.");
        return true;
    }),

    body("priceConfiguration")
        .exists()
        .withMessage("Price configuration is required"),

    body("attributes").exists().withMessage("Attributes is required"),
    body("categoryId").exists().withMessage("Category Id is required"),
    // body("isPublish").exists().withMessage("Attributes is required"),
];
