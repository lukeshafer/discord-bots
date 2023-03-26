import { Config } from "sst/node/config";
import { sendMessage } from "@discord-bots/core/discord-client";

export async function main() {
	console.log("Announcing server is starting");

	await sendMessage({
		channelId: Config.DISCORD_CHANNEL_ID,
		body: {
			content: `Minecraft server is starting! Please wait... (this takes about 2-3 minutes)`,
			components: [],
		},
	});
}
