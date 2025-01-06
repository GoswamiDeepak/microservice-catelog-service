import { MessageProducerBroker } from "../types/broker";
import { KafkaProducerBroker } from "../../config/kafka";
import config from "config";

let messageProducer: MessageProducerBroker | null = null;

export const createMessageProducerBroker = (): MessageProducerBroker => {
    //making singletone
    if (!messageProducer) {
        messageProducer = new KafkaProducerBroker("catalog-service", [
            config.get("kafka.broker"),
        ]);
    }
    return messageProducer;
};
