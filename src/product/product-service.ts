import { PaginationLabels } from "../config/pagination";
import ProductModel from "./product-model";
import { Filter, PaginationQuery, Product } from "./product-types";

export class ProductService {
    async createProduct(product: Product) {
        return (await ProductModel.create(product)) as Product;
    }

    async updateProduct(productId: string, product: Product) {
        return (await ProductModel.findOneAndUpdate(
            { _id: productId },
            { $set: product },
            { new: true },
        )) as Product;
    }

    async getProduct(productId: string): Promise<Product | null> {
        return await ProductModel.findOne({ _id: productId });
    }

    async getProducts(
        q: string,
        filters: Filter,
        paginateQuery: PaginationQuery,
    ) {
        const searchQueryRegexp = new RegExp(q, "i");

        const matchQuery = {
            ...filters,
            name: searchQueryRegexp,
        };

        const aggregate = ProductModel.aggregate([
            {
                $match: matchQuery,
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "category",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                attributes: 1,
                                priceConfiguration: 1,
                            },
                        },
                    ],
                },
            },
            {
                $unwind: "$category",
            },
        ]);
        return ProductModel.aggregatePaginate(aggregate, {
            ...paginateQuery,
            customLabels: PaginationLabels,
        });
        // const result = await aggregate.exec();
        // return result as Product[];
    }

    async deleteProduct(productId: string) {
        return await ProductModel.findByIdAndDelete(productId);
    }
}
