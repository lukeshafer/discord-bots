import { Config } from "sst/node/config";
import { sendMessage } from "@discord-bots/core/discord-client";

export async function main() {
	console.log("Announcing server is ready");

	await sendMessage({
		channelId: Config.DISCORD_CHANNEL_ID,
		body: {
			content: `Minecraft server is online! \nServer address: **minecraft.lksh.dev!**`,
			components: [],
		},
	});
}
