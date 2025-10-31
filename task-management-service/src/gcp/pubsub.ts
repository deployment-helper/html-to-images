import { PubSub, Topic } from "@google-cloud/pubsub";

/**
 * Singleton class for managing Google Cloud Pub/Sub operations
 */
export class PubSubManager {
  private static instance: PubSubManager;
  private pubsub: PubSub;
  private topics: Map<string, Topic>;

  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor() {
    this.pubsub = new PubSub();
    this.topics = new Map();
  }

  /**
   * Get the singleton instance of PubSubManager
   */
  public static getInstance(): PubSubManager {
    if (!PubSubManager.instance) {
      PubSubManager.instance = new PubSubManager();
    }
    return PubSubManager.instance;
  }

  /**
   * Get or create a topic
   */
  private getTopic(topicName: string): Topic {
    if (!this.topics.has(topicName)) {
      this.topics.set(topicName, this.pubsub.topic(topicName));
    }
    return this.topics.get(topicName)!;
  }

  /**
   * Publish a message to a Pub/Sub topic
   * @param topicName - The name of the topic
   * @param message - The message data (object will be converted to JSON)
   * @param attributes - Optional attributes to attach to the message
   * @returns The message ID
   */
  public async publishMessage(
    topicName: string,
    message: any,
    attributes?: Record<string, string>
  ): Promise<string> {
    try {
      const topic = this.getTopic(topicName);
      const data = Buffer.from(JSON.stringify(message));
      const messageId = await topic.publishMessage({
        data,
        attributes,
      });
      console.log(`Message ${messageId} published to topic ${topicName}`);
      return messageId;
    } catch (error) {
      console.error(`Error publishing message to ${topicName}:`, error);
      throw error;
    }
  }

  /**
   * Publish multiple messages to a Pub/Sub topic
   * @param topicName - The name of the topic
   * @param messages - Array of messages with optional attributes
   * @returns Array of message IDs
   */
  public async publishMessages(
    topicName: string,
    messages: Array<{ data: any; attributes?: Record<string, string> }>
  ): Promise<string[]> {
    try {
      const topic = this.getTopic(topicName);
      const messageIds: string[] = [];

      for (const message of messages) {
        const data = Buffer.from(JSON.stringify(message.data));
        const messageId = await topic.publishMessage({
          data,
          attributes: message.attributes,
        });
        messageIds.push(messageId);
      }

      console.log(
        `${messageIds.length} messages published to topic ${topicName}`
      );
      return messageIds;
    } catch (error) {
      console.error(`Error publishing messages to ${topicName}:`, error);
      throw error;
    }
  }

  /**
   * Create a new topic
   * @param topicName - The name of the topic to create
   */
  public async createTopic(topicName: string): Promise<void> {
    try {
      const [topic] = await this.pubsub.createTopic(topicName);
      this.topics.set(topicName, topic);
      console.log(`Topic ${topicName} created successfully`);
    } catch (error) {
      console.error(`Error creating topic ${topicName}:`, error);
      throw error;
    }
  }
}

// Export a convenience function to get the singleton instance
export const getPubSubManager = () => PubSubManager.getInstance();
