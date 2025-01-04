import ToppingModel from "./topping-model";
import { Topping, ToppingFilter } from "./topping-types";

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

    async getAll(filter: ToppingFilter) {
        // eslint-disable-next-line no-console
        console.log("filter", filter);
        // return;
        return await ToppingModel.find(filter).select("-__v").lean();
    }

    async deleteTopping(toppingId: string) {
        return await ToppingModel.findByIdAndDelete(toppingId);
    }
}
