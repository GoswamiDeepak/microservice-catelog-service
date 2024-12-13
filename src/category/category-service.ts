import CategoryModel from "./category-model";
import { Category } from "./category-types";

export class CategoryService {
    async create(category: Category) {
        const newCategory = new CategoryModel(category);
        return await newCategory.save();
    }

    async getAll() {
        return await CategoryModel.find({});
    }
    async getById(id: string) {
        return await CategoryModel.findById(id);
    }
    async update(id: string, category: Category) {
        return await CategoryModel.findByIdAndUpdate(id, category, {
            new: true,
        });
    }
    async delete(id: string) {
        await CategoryModel.findByIdAndDelete(id);
    }
}
