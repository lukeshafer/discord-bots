import { DiscordEventBus } from "./EventBus";
import {
	Api,
	Table,
	Config,
	Cron,
	type StackContext,
	use,
} from "sst/constructs";

export function SnailyBot({ stack }: StackContext) {
	const { eventBus } = use(DiscordEventBus);

	const DISCORD_CLIENT_ID = new Config.Secret(stack, "DISCORD_CLIENT_ID");
	const DISCORD_CLIENT_SECRET = new Config.Secret(
		stack,
		"DISCORD_CLIENT_SECRET"
	);
	const DISCORD_PUBLIC_KEY = new Config.Secret(stack, "DISCORD_PUBLIC_KEY");
	const DISCORD_APPLICATION_ID = new Config.Secret(
		stack,
		"DISCORD_APPLICATION_ID"
	);

	const DISCORD_TOKEN = new Config.Secret(stack, "DISCORD_TOKEN");
	const table = new Table(stack, "GuildUsers", {
		fields: {
			guildId: "string",
			userId: "string",
			month: "string",
			day: "string",
			year: "string",
		},
		primaryIndex: { partitionKey: "guildId", sortKey: "userId" },
	});

	const checkBirthdayToday = new Cron(stack, "CheckBirthdayToday", {
		schedule: "cron(0 16 * * ? *)",
		job: "packages/functions/check-birthday-today.main",
	});

	checkBirthdayToday.bind([
		table,
		DISCORD_TOKEN,
		DISCORD_APPLICATION_ID,
		new Config.Secret(stack, "BIRTHDAY_ANNOUNCE_CHANNEL"),
	]);

	const api = new Api(stack, "Api", {
		routes: {
			"POST /": "packages/functions/api.main",
			"GET /register": "packages/functions/register-commands.main",
			"GET /birthday": "packages/functions/check-birthday-today.main",
		},
		defaults: {
			function: {
				bind: [
					table,
					DISCORD_CLIENT_ID,
					DISCORD_CLIENT_SECRET,
					DISCORD_PUBLIC_KEY,
					DISCORD_APPLICATION_ID,
					DISCORD_TOKEN,
					eventBus,
				],
			},
		},
	});

	stack.addOutputs({
		ApiEndpoint: api.url,
	});

	return {
		DISCORD_CLIENT_ID,
		DISCORD_CLIENT_SECRET,
		DISCORD_PUBLIC_KEY,
		DISCORD_APPLICATION_ID,
		DISCORD_TOKEN,
	};
}
