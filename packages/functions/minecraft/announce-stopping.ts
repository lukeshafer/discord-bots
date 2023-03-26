import { Config } from "sst/node/config";
import { sendMessage } from "@discord-bots/core/discord-client";

export async function main() {
	console.log("Announcing server is stopping");

	await sendMessage({
		channelId: Config.DISCORD_CHANNEL_ID,
		body: {
			content: `No players online for a while. Stopping server in one minute...`,
			components: [],
		},
	});
}
