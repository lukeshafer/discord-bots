import { EventBridge } from "aws-sdk";
import { EventBus } from "sst/node/event-bus";

export async function main() {
	console.log("Sending event to start server");
	const eventBus = new EventBridge();

	const result = await eventBus
		.putEvents({
			Entries: [
				{
					Source: "minecraft",
					DetailType: "start",
					Detail: JSON.stringify({
						message: `Minecraft Server is starting`,
					}),
					EventBusName: EventBus.DiscordEventBus.eventBusName,
				},
			],
		})
		.promise();

	console.log("Result: ", result);
}
