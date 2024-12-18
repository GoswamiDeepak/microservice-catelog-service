import { body } from "express-validator";

export default [
    body("name")
        .exists()
        .withMessage("Topping name is required")
        .isString()
        .withMessage("Topping name must be a string"),
    body("price")
        .exists()
        .withMessage("Price is required")
        .isNumeric()
        .withMessage("Price must be a Number"),
    body("tenantId").exists().withMessage("Tenant Id is required"),
    body("isPublish").exists().withMessage("Attributes is required"),
    body("image").custom((value, { req }) => {
        if (!req.files) {
            throw new Error("product Image is required.");
        }
        return true;
    }),
];
