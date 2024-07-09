import { Cluster, FargateService } from "aws-cdk-lib/aws-ecs";
import {
	Role,
	ServicePrincipal,
	ManagedPolicy,
	PolicyDocument,
	PolicyStatement,
} from "aws-cdk-lib/aws-iam";
import { Stack, Config, EventBus, Function, use } from "sst/constructs";

import { SnailyBot } from "../SnailyBot";

export function MinecraftLambda(
	stack: Stack,
	props: {
		cluster: Cluster;
		service: FargateService;
		eventBus: EventBus;
		stage: string;
	},
) {
	const { DISCORD_TOKEN } = use(SnailyBot);

	const DISCORD_CHANNEL_ID = new Config.Parameter(stack, "DISCORD_CHANNEL_ID", {
		value: "1259913410615971902",
	});

	const lambdaRole = new Role(stack, "LambdaRole", {
		assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
		inlinePolicies: {
			ecsPolicy: new PolicyDocument({
				statements: [
					new PolicyStatement({
						resources: ["*"],
						actions: ["ecs:*"],
					}),
				],
			}),
		},
		managedPolicies: [
			ManagedPolicy.fromAwsManagedPolicyName(
				"service-role/AWSLambdaBasicExecutionRole",
			),
		],
	});

	const CLUSTER_NAME = new Config.Parameter(stack, "CLUSTER_NAME", {
		value: props.cluster.clusterName,
	});

	const SERVICE_NAME = new Config.Parameter(stack, "SERVICE_NAME", {
		value: props.service.serviceName,
	});

	const startServerFunction = new Function(stack, "StartServerFunction", {
		bind: [CLUSTER_NAME, SERVICE_NAME],
		role: lambdaRole,
		handler: "packages/functions/minecraft/start-server.main",
	});

	const announceServerStartingFunction = new Function(
		stack,
		"AnnounceServerStartingFunction",
		{
			bind: [DISCORD_CHANNEL_ID, DISCORD_TOKEN],
			handler: "packages/functions/minecraft/announce-starting.main",
		},
	);

	const announceServerReadyFunction = new Function(
		stack,
		"AnnounceServerReadyFunction",
		{
			bind: [DISCORD_CHANNEL_ID, DISCORD_TOKEN],
			handler: "packages/functions/minecraft/announce-ready.main",
		},
	);

	const stopServerFunction = new Function(stack, "StopServerFunction", {
		bind: [CLUSTER_NAME, SERVICE_NAME],
		role: lambdaRole,
		handler: "packages/functions/minecraft/stop-server.main",
	});

	const announceServerStoppingFunction = new Function(
		stack,
		"AnnounceServerStoppingFunction",
		{
			bind: [DISCORD_CHANNEL_ID, DISCORD_TOKEN],
			handler: "packages/functions/minecraft/announce-stopping.main",
		},
	);

	const announceServerStoppedFunction = new Function(
		stack,
		"AnnounceServerStoppedFunction",
		{
			bind: [DISCORD_CHANNEL_ID, DISCORD_TOKEN],
			handler: "packages/functions/minecraft/announce-stopped.main",
		},
	);

	props.eventBus.addRules(stack, {
		"minecraft-start": {
			pattern: { source: ["minecraft"], detailType: ["start"] },
			targets: {
				startServer: startServerFunction,
				announceServerStarting: announceServerStartingFunction,
			},
		},
		"minecraft-stop": {
			pattern: { source: ["minecraft"], detailType: ["stop"] },
			targets: {
				stopServer: stopServerFunction,
				announceServerStopped: announceServerStoppedFunction,
			},
		},
		"minecraft-ready": {
			pattern: { source: ["minecraft"], detailType: ["ready"] },
			targets: {
				announceServerReady: announceServerReadyFunction,
			},
		},
		"minecraft-stopping": {
			pattern: { source: ["minecraft"], detailType: ["willStop"] },
			targets: {
				announceServerStopping: announceServerStoppingFunction,
			},
		},
	});
}
