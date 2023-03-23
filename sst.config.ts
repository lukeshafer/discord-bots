import { SSTConfig } from "sst";
import { SnailyBot } from "./stacks/SnailyBot";
import { Minecraft } from "./stacks/Minecraft";
import { DiscordEventBus } from "./stacks/EventBus";

export default {
	config(_input) {
		return {
			name: "discord-bots",
			region: "us-east-2",
		};
	},
	stacks(app) {
		app.stack(DiscordEventBus).stack(SnailyBot).stack(Minecraft);
	},
} satisfies SSTConfig;
