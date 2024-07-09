import { Config } from "sst/node/config";
import { sendMessage } from "@discord-bots/core/discord-client";

export async function main() {
	console.log("Announcing server is ready");

	const address =
		process.env.SST_STAGE === "prod"
			? "minecraft.lksh.dev"
			: `${process.env.SST_STAGE}-minecraft.lksh.dev`;

	await sendMessage({
		channelId: Config.DISCORD_CHANNEL_ID,
		body: {
			content: `Minecraft server is online! \nServer address: **${address}**`,
			components: [],
		},
	});
}
