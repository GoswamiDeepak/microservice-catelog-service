import ToppingModel from "./topping-model";
import { Topping } from "./topping-types";

export class ToppingService {
    async create(topping: Topping) {
        return await ToppingModel.create(topping);
    }
}
