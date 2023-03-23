import { executeCommand } from "@discord-bots/core/commands";
import { Interaction } from "@discord-bots/core/discord-client";
import {
	InteractionType,
	InteractionResponseType,
	APIInteraction,
} from "discord-api-types/v10";
import { EventBus } from "sst/node/event-bus";
import { EventBridge } from "aws-sdk";

export const main = async (event: { body: APIInteraction }) => {
	const { body } = event;
	console.log("Received interaction", typeof body, body);

	switch (body.type) {
		case InteractionType.Ping:
			return {
				statusCode: 200,
				body: JSON.stringify({
					type: InteractionResponseType.Pong,
				}),
			};
		case InteractionType.ApplicationCommand:
			const interaction = new Interaction(body);

			try {
				await executeCommand(interaction);
				return {
					statusCode: 200,
				};
			} catch (error) {
				console.error("An error occurred", error);
				return {
					statusCode: 500,
					body: "An error occurred",
				};
			}
			break;
		case InteractionType.MessageComponent:
			const componentInteraction = new Interaction(body);
			if (
				body.data.component_type === 2 &&
				body.data.custom_id === "startServer"
			) {
				componentInteraction.editResponse({
					content: body.member
						? `<@${body.member.user.id}> is launching the server`
						: "Launching the server",
				});
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
			break;
		default:
			console.log("Unhandled interaction", body);
			return {
				statusCode: 200,
				body: "Unhandled interaction",
			};
	}

	return {
		statusCode: 200,
		body: "Unhandled request",
	};
};
