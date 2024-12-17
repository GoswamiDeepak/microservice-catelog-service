import ProductModel from "./product-model";
import { Product } from "./product-types";

export class ProductService {
    async createProduct(product: Product) {
        return await ProductModel.create(product);
    }

    async getProductImage(productId: string) {
        const product = await ProductModel.findById(productId);
        return product?.image;
    }

    async updateProduct(productId: string, product: Product) {
        return await ProductModel.findOneAndUpdate(
            { _id: productId },
            { $set: product },
            { new: true },
        );
    }
}
