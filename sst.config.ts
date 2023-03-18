import { SSTConfig } from "sst";
import { SnailyBot } from "./stacks/SnailyBot";

export default {
	config(_input) {
		return {
			name: "discord-bots",
			region: "us-east-2",
		};
	},
	stacks(app) {
		app.stack(SnailyBot);
	},
} satisfies SSTConfig;
