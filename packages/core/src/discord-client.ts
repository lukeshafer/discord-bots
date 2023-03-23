import {
	type APIInteractionResponseCallbackData,
	InteractionResponseType,
	GatewayVersion,
	type RESTPostAPIChannelMessageJSONBody,
	type RESTPostAPIChannelMessageResult,
	type APIInteraction,
} from "discord-api-types/v10";
import { Config } from "sst/node/config";
import fetch from "node-fetch";

export class Interaction<T extends APIInteraction> {
	interaction;
	id;
	token;
	callbackUrl;
	baseWebhookURL;
	data;
	deferred = false;
	constructor(interaction: T) {
		this.interaction = interaction;
		this.id = interaction.id;
		this.token = interaction.token;
		this.data = interaction.data;
		this.callbackUrl = `https://discord.com/api/v${GatewayVersion}/interactions/${this.id}/${this.token}/callback`;
		this.baseWebhookURL = `https://discord.com/api/v${GatewayVersion}/webhooks/${Config.DISCORD_APPLICATION_ID}/${this.token}`;
	}

	async defer(isEphemeral = false) {
		console.log("Deferring response");

		const result = await fetch(new URL(this.callbackUrl), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				type: InteractionResponseType.DeferredChannelMessageWithSource,
				data: {
					flags: isEphemeral ? 64 : undefined,
				},
			}),
		});

		console.log("Result: ", result);
	}

	async sendResponse(response: APIInteractionResponseCallbackData) {
		const result = await fetch(new URL(this.callbackUrl), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				type: InteractionResponseType.ChannelMessageWithSource,
				data: response,
			}),
		});

		console.log("Result: ", result);
		console.log("Result body: ", await result.text());
	}

	async editResponse(response: APIInteractionResponseCallbackData) {
		const url = `${this.baseWebhookURL}/messages/@original`;

		await fetch(new URL(url), {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(response),
		});
	}
}

export async function sendMessage(args: {
	channelId: string;
	body: RESTPostAPIChannelMessageJSONBody;
}) {
	const tokenHeader = `Bot ${Config.DISCORD_TOKEN}`;
	const url = `https://discord.com/api/v${GatewayVersion}/channels/${args.channelId}/messages`;
	const response = await fetch(new URL(url), {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: tokenHeader,
		},
		body: JSON.stringify(args.body),
	}).then(async (result) => {
		if (!result.ok) {
			console.log(await result.text());
			throw new Error("Failed to send message");
		}
		return result.json() as Promise<RESTPostAPIChannelMessageResult>;
	});

	return response;
}

export async function editMessage(args: {
	channelId: string;
	messageId: string;
	body: RESTPostAPIChannelMessageJSONBody;
}) {
	const tokenHeader = `Bot ${Config.DISCORD_TOKEN}`;
	const url = `https://discord.com/api/v${GatewayVersion}/channels/${args.channelId}/messages/${args.messageId}`;
	const response = await fetch(new URL(url), {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
			Authorization: tokenHeader,
		},
		body: JSON.stringify(args.body),
	}).then(async (result) => {
		if (!result.ok) {
			console.log(await result.text());
			throw new Error("Failed to edit message");
		}
		return result.json() as Promise<RESTPostAPIChannelMessageResult>;
	});

	return response;
}
