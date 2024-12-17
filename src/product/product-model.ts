import mongoose from "mongoose";

export const priceConfiguarationSchema = new mongoose.Schema({
    priceType: {
        type: String,
        enum: ["base", "aditional"],
        required: true,
    },
    availableOptions: {
        type: Map,
        of: Number,
        required: true,
    },
});

export const attributeSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
    },
});

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        image: {
            type: String,
            required: true,
        },
        priceConfiguration: {
            type: Map,
            of: priceConfiguarationSchema,
            required: true,
        },
        attributes: [attributeSchema],
        tenantId: {
            type: String,
            required: true,
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
        },
        isPublish: {
            type: Boolean,
            default: false,
            required: false,
        },
    },
    { timestamps: true },
);

export default mongoose.model("Product", productSchema);