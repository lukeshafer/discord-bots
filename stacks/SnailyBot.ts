import { Api, Table, Config, type StackContext } from "sst/constructs";

export function SnailyBot({ stack }: StackContext) {
	const table = new Table(stack, "Birthdays", {
		fields: {
			userId: "string",
			birthday: "string",
		},
		primaryIndex: { partitionKey: "userId" },
	});

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

	const api = new Api(stack, "Api", {
		routes: {
			"POST /": "packages/functions/api.post",
			"GET /register": "packages/functions/register-commands.handler",
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
				],
			},
		},
	});

	stack.addOutputs({
		ApiEndpoint: api.url,
	});
}
