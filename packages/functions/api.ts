import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from "aws-lambda";
import { z } from "zod";
import { executeCommand } from "@discord-bots/core/commands";
import { Interaction } from "@discord-bots/core/interaction-client";
import {
	InteractionType,
	InteractionResponseType,
	APIInteraction,
} from "discord-api-types/v10";
import { verifyKey } from "discord-interactions";
import { Config } from "sst/node/config";

export const main: APIGatewayProxyHandlerV2 = async (event) => {
	const authorizationResult = handleAuthorization(event);
	if (authorizationResult.shouldReturn) return authorizationResult.response;

	let body;
	try {
		body = parseInteractionBody(event.body!);
	} catch (error) {
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

export function parseInteractionBody(rawBody: string): APIInteraction {
	const body = JSON.parse(rawBody);
	const result = baseInteraction.parse(body);
	return result as APIInteraction;
}

const baseInteraction = z
	.object({
		id: z.string(),
		application_id: z.string(),
		type: z.nativeEnum(InteractionType),
	})
	.passthrough();
