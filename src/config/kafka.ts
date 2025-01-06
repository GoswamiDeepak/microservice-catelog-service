import { Kafka, Producer } from "kafkajs";
import { MessageProducerBroker } from "../common/types/broker";

export class KafkaProducerBroker implements MessageProducerBroker {
    private producer: Producer;

    constructor(clientId: string, brokers: string[]) {
        const kafka = new Kafka({
            clientId,
            brokers,
        });
        this.producer = kafka.producer();
    }
    /**
     * connect the producer
     */
    connect = async () => {
        await this.producer.connect();
    };
    /**
     * Disconnect the producer
     */
    disconnect = async () => {
        if (this.producer) {
            await this.producer.disconnect();
        }
    };
    /**
     *
     * @param topic -the topic to send the message to
     * @param message - the message to send
     * @throws {error} - when the producer is not connected
     */
    sendMessage = async (topic: string, message: string) => {
        await this.producer.send({
            topic,
            messages: [
                {
                    value: message,
                },
            ],
        });
    };
}
