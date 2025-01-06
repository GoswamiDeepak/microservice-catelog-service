import app from "./app";
import { createMessageProducerBroker } from "./common/factories/brokerFactory";
import { MessageProducerBroker } from "./common/types/broker";
import { initDb } from "./config/db";
import logger from "./config/logger";
import config from "config";

const startServer = async () => {
    const PORT: number = config.get("server.port") || 5502;
    let messageProducerBroker: MessageProducerBroker | null = null;
    try {
        await initDb();
        logger.info("Connected to database");

        //connect to kafka
        messageProducerBroker = createMessageProducerBroker();
        await messageProducerBroker.connect();

        app.listen(PORT, () => logger.info(`Listening on port ${PORT}`));
    } catch (err: unknown) {
        if (err instanceof Error) {
            // Safely disconnect Kafka producer if it was initialized
            if (messageProducerBroker) {
                await messageProducerBroker.disconnect();
            }
            logger.error(err.message);
            logger.on("finish", () => {
                process.exit(1);
            });
        }
    }
};

void startServer();
