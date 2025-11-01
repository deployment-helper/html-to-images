import json
from typing import Dict
from google.cloud import pubsub_v1
from app.settings import settings

publisher = pubsub_v1.PublisherClient()
subscriber = pubsub_v1.SubscriberClient()


class PubSub:
    topic_name: str
    subscription_name: str

    def __init__(self):
        self.topic_name = settings.gcp_pubsub_topic
        self.subscription_name = settings.gcp_pubsub_subscription

    async def publish_msg(self, msg: Dict):
        msg_bytes = json.dumps(msg).encode("utf-8")
        future = publisher.publish(self.topic_name, msg_bytes)
        return future.result()

    async def pull_msg(self):
        resp = subscriber.pull(subscription=self.subscription_name, max_messages=1)
        return resp.received_messages


pubsub_client = PubSub()


async def get_pubsub():
    return pubsub_client
