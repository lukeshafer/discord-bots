import { Config } from "sst/node/config";
import { sendMessage } from "@discord-bots/core/discord-client";
import { ComponentType, ButtonStyle } from "discord-api-types/v10";

export async function main() {
	console.log("Announcing server is stopped");
	await sendMessage({
		channelId: Config.DISCORD_CHANNEL_ID,
		body: {
			content: `Minecraft server is offline`,
			components: [
				{
					type: ComponentType.ActionRow,
					components: [
						{
							custom_id: "startServer",
							type: ComponentType.Button,
							style: ButtonStyle.Primary,
							label: "Launch Server",
						},
					],
				},
			],
		},
	});
}
