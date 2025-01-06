import { MessageProducerBroker } from "../types/broker";
import { KafkaProducerBroker } from "../../config/kafka";
import config from "config";

// Variable to hold the single instance
let messageProducer: MessageProducerBroker | null = null;

// Factory function to create or return the singleton instance
export const createMessageProducerBroker = (): MessageProducerBroker => {
    // Check if the instance already exists
    if (!messageProducer) {
        // Create a new instance if it doesn't exist
        messageProducer = new KafkaProducerBroker("catalog-service", [
            config.get("kafka.broker"),
        ]);
    }
    // Return the singleton instance
    return messageProducer;
};
