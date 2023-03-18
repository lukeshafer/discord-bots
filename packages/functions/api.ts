import {
	APIGatewayProxyEventV2, APIGatewayProxyHandlerV2
} from "aws-lambda";
import {
	parseInteractionBody,
	type Interaction,
} from "@discord-bots/core/discord-types";

import {
	InteractionResponseType,
	InteractionType,
	verifyKey,
} from "discord-interactions";
import {
	Config
} from "sst/node/config";

export const post: APIGatewayProxyHandlerV2 = async (event) => {
	const authorizationResult = handleAuthorization(event);
	if (authorizationResult.shouldReturn) return authorizationResult.response;

	let body: Interaction;
	try {
		body = parseInteractionBody(event.body!);
	} catch (error) {
		return {
			statusCode: 400,
			body: "Invalid request body",
		};
	}

	console.log(body);

	switch (body.type) {
		case InteractionType.PING:
			return {
				statusCode: 200,
				body: JSON.stringify({
					type: InteractionResponseType.PONG,
				}),
			};

		case InteractionType.APPLICATION_COMMAND:
			const command = body.data.name;
			console.log(command);
			return command;

		default:
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
	const signature = event.headers[
		"x-signature-ed25519"
	];
	const timestamp = event.headers[
		"x-signature-timestamp"
	];

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
