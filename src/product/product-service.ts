import ProductModel from "./product-model";
import { Product } from "./product-types";

export class ProductService {
    async createProduct(product: Product) {
        return await ProductModel.create(product);
    }

    async updateProduct(productId: string, product: Product) {
        return await ProductModel.findOneAndUpdate(
            { _id: productId },
            { $set: product },
            { new: true },
        );
    }

    async getProduct(productId: string): Promise<Product | null> {
        return await ProductModel.findOne({ _id: productId });
    }
}
