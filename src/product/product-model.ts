import mongoose, { AggregatePaginateModel } from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { Product } from "./product-types";

// Price Configuration ka schema define kiya gaya hai
// Isme priceType aur availableOptions fields hain
export const priceConfiguarationSchema = new mongoose.Schema({
    priceType: {
        type: String,
        enum: ["base", "aditional"], // priceType ya to "base" hoga ya "additional"
        required: true, // ye field required hai
    },
    availableOptions: {
        type: Map, // availableOptions ek Map hai jisme keys strings hain aur values numbers hain
        of: Number, // Map ke andar values numbers hongi
        required: true, // ye field bhi required hai
    },
});

// Attribute ka schema define kiya gaya hai
// Isme name aur value fields hain
export const attributeSchema = new mongoose.Schema({
    name: {
        type: String, // name ek string hai
    },
    value: {
        type: mongoose.Schema.Types.Mixed, // value koi bhi type ho sakta hai (Mixed type)
    },
});

// Product ka main schema define kiya gaya hai
const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true, // product ka name required hai
        },
        description: {
            type: String,
            required: true, // description bhi required hai
        },
        image: {
            type: String,
            required: true, // image URL bhi required hai
        },
        priceConfiguration: {
            type: Map, // priceConfiguration ek Map hai
            of: priceConfiguarationSchema, // Map ke andar values priceConfiguarationSchema ke according hongi
            required: true, // ye field bhi required hai
        },
        attributes: [attributeSchema], // attributes ek array hai jisme attributeSchema ke objects honge
        tenantId: {
            type: String,
            required: true, // tenantId required hai
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId, // categoryId ek ObjectId hai
            ref: "Category", // ye "Category" collection se refer karta hai
        },
        isPublish: {
            type: Boolean,
            default: false, // by default product publish nahi hoga
            required: false, // ye field required nahi hai
        },
    },
    { timestamps: true }, // timestamps true karne se createdAt aur updatedAt fields automatically add ho jayenge
);

// mongoose-aggregate-paginate-v2 plugin ko productSchema mein add kiya gaya hai
// Isse aggregation queries ke sath pagination karne ki facility milti hai
productSchema.plugin(aggregatePaginate);

// Product model ko export kiya gaya hai
// Ye model Product type aur AggregatePaginateModel type ka hai
export default mongoose.model<Product, AggregatePaginateModel<Product>>(
    "Product", // Model ka naam "Product" hai
    productSchema, // Model productSchema ko use karega
);

/*
import mongoose, { AggregatePaginateModel } from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { Product } from "./product-types";

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

productSchema.plugin(aggregatePaginate);

export default mongoose.model<Product, AggregatePaginateModel<Product>>(
    "Product",
    productSchema,
);
*/
