import ToppingModel from "./topping-model";
import { Topping } from "./topping-types";

export class ToppingService {
    async create(topping: Topping) {
        return await ToppingModel.create(topping);
    }

    async getTopping(toppingId: string) {
        return await ToppingModel.findOne({ _id: toppingId });
    }

    async updateTopping(toppingId: string, topping: Topping) {
        return await ToppingModel.findByIdAndUpdate(
            toppingId,
            {
                $set: topping,
            },
            { new: true },
        );
    }

    async getAll() {
        return await ToppingModel.find({}).select("-__v").lean();
    }

    async deleteTopping(toppingId: string) {
        return await ToppingModel.findByIdAndDelete(toppingId);
    }
}
