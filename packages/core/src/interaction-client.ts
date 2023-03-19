import {
	type APIApplicationCommandInteraction,
	type APIInteractionResponseCallbackData,
	InteractionResponseType,
} from "discord-api-types/v10";
import { Config } from "sst/node/config";

export class Interaction {
	interaction;
	id;
	token;
	callbackUrl;
	baseWebhookURL;
	data;
	name;
	deferred = false;
	constructor(interaction: APIApplicationCommandInteraction) {
		const VERSION = "v10";

		this.interaction = interaction;
		this.id = interaction.id;
		this.token = interaction.token;
		this.data = interaction.data;
		this.name = this.data.name;
		this.callbackUrl = `https://discord.com/api/v10/interactions/${this.id}/${this.token}/callback`;
		this.baseWebhookURL = `https://discord.com/api/v10/webhooks/${Config.DISCORD_APPLICATION_ID}/${this.token}`;
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

		const result = await fetch(new URL(url), {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(response),
		});
	}
}
