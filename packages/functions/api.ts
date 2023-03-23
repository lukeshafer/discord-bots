import {
	type APIGatewayProxyEventV2,
	type APIGatewayProxyHandlerV2,
} from "aws-lambda";
import type { APIInteraction } from "discord-api-types/v10";
import { verifyKey } from "discord-interactions";
import { Config } from "sst/node/config";
import { Function } from "sst/node/function";
import { Lambda } from "aws-sdk";
import fetch from "node-fetch";

export const main: APIGatewayProxyHandlerV2 = async (event) => {
	const authorizationResult = handleAuthorization(event);
	if (authorizationResult.shouldReturn) return authorizationResult.response;

	const body = JSON.parse(event.body!) as APIInteraction;
	if (!body?.id || !body?.application_id || !body?.type) {
		console.log("Invalid request body", body);
		return {
			statusCode: 400,
			body: "Invalid request body",
		};
	}

	if (body.type === 1) {
		return {
			statusCode: 200,
			body: JSON.stringify({
				type: 1,
			}),
		};
	}

	await fetch(
		new URL(
			`https://discord.com/api/v10/interactions/${body.id}/${body.token}/callback`
		),
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				type: body.type === 3 ? 6 : 5,
				data: {
					flags: 0,
				},
			}),
		}
	);

	const lambda = new Lambda();
	await lambda
		.invoke({
			FunctionName: Function.DiscordApiHandler.functionName,
			Payload: JSON.stringify({ body }),
		})
		.promise();

	return {};
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
