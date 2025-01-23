// import config from "config";
import express, { Request, Response } from "express";
import { globalErrorHandler } from "./common/middlewares/globalErrorHandler";
import categoryRouter from "./category/category-router";
import cookieParser from "cookie-parser";
import productRouter from "./product/product-router";
import toppingRouter from "./topping/topping-route";
import cors from "cors";
import config from "config";

const app = express();

// const corsOptions: CorsOptions = {
//     origin: config.get<string>("frontend.url"),
//     credentials: true,
// };

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
// app.use(cors(corsOptions));
app.use(
    cors({
        origin: [config.get("frontend.url"), "http://localhost:5173"],
        credentials: true,
    }),
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
    res.send("Hello World!");
});

app.use("/categories", categoryRouter);
app.use("/products", productRouter);
app.use("/toppings", toppingRouter);

app.use(globalErrorHandler);

export default app;
