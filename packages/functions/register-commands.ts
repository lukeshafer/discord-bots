import { Config } from "sst/node/config";
import { getCommandsForRegistration } from "@discord-bots/core/commands";
import fetch from "node-fetch";

export async function main() {
	const url = `https://discord.com/api/v10/applications/${Config.DISCORD_APPLICATION_ID}/commands`;

	const commands = getCommandsForRegistration();
	console.log("Registering commands", commands);

	const response = await fetch(url, {
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bot ${Config.DISCORD_TOKEN}`,
		},
		method: "PUT",
		body: JSON.stringify(commands),
	});

	if (response.ok) {
		console.log("Registered all commands");
	} else {
		console.error("Error registering commands");
		const text = await response.text();
		console.error(text);
	}

	return response;
}
