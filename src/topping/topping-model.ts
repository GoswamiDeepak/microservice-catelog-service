import mongoose from "mongoose";
import { Topping } from "./topping-types";

const toppingSchema = new mongoose.Schema<Topping>(
    {
        name: {
            type: String,
            required: true,
        },
        image: {
            type: String,
            required: true,
        },
        price: {
            type: String,
            required: true,
        },
        tenantId: {
            type: String,
            required: true,
        },
        isPublish: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true },
);

export default mongoose.model("Topping", toppingSchema);
