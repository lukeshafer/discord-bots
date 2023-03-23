import { ECS, EventBridge } from "aws-sdk";
import { Config } from "sst/node/config";
import { EventBus } from "sst/node/event-bus";
import { sendMessage } from "@discord-bots/core/discord-client";
import { ComponentType, ButtonStyle } from "discord-api-types/v10";

const ecs = new ECS();
export async function start() {
	const service = await ecs
		.describeServices({
			cluster: Config.CLUSTER_NAME,
			services: [Config.SERVICE_NAME],
		})
		.promise();

	console.log("Service: ", service);
	if (service.services?.[0].desiredCount === 1) {
		console.log("Minecraft Server is already running");
		return;
	}

	console.log("Starting Minecraft Server");

	await ecs
		.updateService({
			cluster: Config.CLUSTER_NAME,
			service: Config.SERVICE_NAME,
			desiredCount: 1,
		})
		.promise()
		.then(() => {
			console.log("Updated desired count to 1");
		})
		.catch((err) => {
			console.log("Error: ", err);
		});
}

export async function stop() {
	const service = await ecs
		.describeServices({
			cluster: Config.CLUSTER_NAME,
			services: [Config.SERVICE_NAME],
		})
		.promise();

	if (service.services?.[0].desiredCount === 0) {
		console.log("Minecraft Server is already stopped");
		return;
	}

	console.log("Stopping Minecraft Server");

	await ecs
		.updateService({
			cluster: Config.CLUSTER_NAME,
			service: Config.SERVICE_NAME,
			desiredCount: 0,
		})
		.promise()
		.then(() => {
			console.log("Updated desired count to 0");
		})
		.catch((err) => {
			console.log("Error: ", err);
		});
}

export async function invokeStart() {
	console.log("Sending event to start server");
	const eventBus = new EventBridge();

	const result = await eventBus
		.putEvents({
			Entries: [
				{
					Source: "minecraft",
					DetailType: "start",
					Detail: JSON.stringify({
						message: `Minecraft Server is starting`,
					}),
					EventBusName: EventBus.DiscordEventBus.eventBusName,
				},
			],
		})
		.promise();

	console.log("Result: ", result);
}

export async function announceStarting() {
	console.log("Announcing server is starting");

	await sendMessage({
		channelId: Config.DISCORD_CHANNEL_ID,
		body: {
			content: `Minecraft server is starting! Please wait... (this takes about 2-3 minutes)`,
			components: [],
		},
	});
}

export async function announceReady() {
	console.log("Announcing server is ready");

	await sendMessage({
		channelId: Config.DISCORD_CHANNEL_ID,
		body: {
			content: `Minecraft server is online! Join at minecraft.lksh.dev!`,
			components: [],
		},
	});
}

export async function announceStopping() {
	console.log("Announcing server is stopping");
	await sendMessage({
		channelId: Config.DISCORD_CHANNEL_ID,
		body: {
			content: `No players online for a while. Stopping server in one minute...`,
			components: [],
		},
	});
}

export async function announceStopped() {
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
