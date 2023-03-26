import {
	type APIGatewayProxyEventV2,
	type APIGatewayProxyHandlerV2,
} from "aws-lambda";
import {
	type APIInteraction,
	InteractionResponseType,
	InteractionType,
} from "discord-api-types/v10";
import { verifyKey } from "discord-interactions";
import { Config } from "sst/node/config";
import { EventBridge } from "aws-sdk";
import { Interaction } from "@discord-bots/core/discord-client";
import { executeCommand } from "@discord-bots/core/commands";
import { EventBus } from "sst/node/event-bus";

export const main: APIGatewayProxyHandlerV2 = async (event) => {
	const authorizationResult = handleAuthorization(event);
	if (authorizationResult.shouldReturn) return authorizationResult.response;

	// parse and validate
	const body = JSON.parse(event.body!) as APIInteraction;
	if (!body?.id || !body?.application_id || !body?.type) {
		console.log("Invalid request body");
		return {
			statusCode: 400,
			body: "Invalid request body",
		};
	}

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
			}
			return {
				statusCode: 200,
			};
			break;
		default:
			console.log("Unhandled interaction", body);
			return {
				statusCode: 400,
				body: "Unhandled interaction",
			};
	}
};

interface AuthorizeResultReturns {
	shouldReturn: true;
	response: {
		statusCode: number;
		body: string;
	};
}

interface AuthorizeResultContinue {
	shouldReturn: false;
}

type AuthorizeResult = AuthorizeResultReturns | AuthorizeResultContinue;

function handleAuthorization(event: APIGatewayProxyEventV2): AuthorizeResult {
	const signature = event.headers["x-signature-ed25519"];
	const timestamp = event.headers["x-signature-timestamp"];

	if (!signature || !timestamp || !event.body)
		return {
			shouldReturn: true,
			response: {
				statusCode: 401,
				body: "Unauthorized",
			},
		};

	if (!Config.DISCORD_PUBLIC_KEY) {
		console.log("Missing DISCORD_PUBLIC_KEY");
		return {
			shouldReturn: true,
			response: {
				statusCode: 500,
				body: "Internal server error",
			},
		};
	}

	const isValid = verifyKey(
		event.body,
		signature,
		timestamp,
		Config.DISCORD_PUBLIC_KEY
	);

	if (!isValid) {
		console.log("Invalid request signature");
		return {
			shouldReturn: true,
			response: {
				statusCode: 401,
				body: "Bad request signature",
			},
		};
	}

	return {
		shouldReturn: false,
	};
}
