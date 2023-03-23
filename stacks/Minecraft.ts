import { aws_ecs as ecs, aws_ec2 as ec2 } from "aws-cdk-lib";
import { StackContext, use } from "sst/constructs";
import { MinecraftVPC } from "./minecraft-resources/VPC";
import { MinecraftECS } from "./minecraft-resources/ECS";
import { MinecraftLambda } from "./minecraft-resources/Lambda";
import { MinecraftRoute53 } from "./minecraft-resources/Route53";
import constants from "./constants";
import { DiscordEventBus } from "./EventBus";

export interface ServerConfig {
	port: number;
	protocol: ecs.Protocol;
	image: string;
	debug: boolean;
	ingressRule: ec2.Port;
}

export function Minecraft({ stack, app }: StackContext) {
	const { eventBus } = use(DiscordEventBus);

	const SERVER_SUB_DOMAIN =
		app.stage === "prod"
			? constants.SERVER_SUB_DOMAIN
			: `${app.stage}-${constants.SERVER_SUB_DOMAIN}`;

	const config = {
		port: constants.PORT,
		protocol: ecs.Protocol.TCP,
		image: constants.IMAGE,
		debug: constants.DEBUG,
		ingressRule: ec2.Port.tcp(constants.PORT),
	};

	const { vpc, securityGroup } = MinecraftVPC(stack, {
		ingressRule: config.ingressRule,
	});

	const { subDomainZoneId } = MinecraftRoute53(stack, {
		domain: constants.DOMAIN,
		serverSubDomain: SERVER_SUB_DOMAIN,
		hostedZoneId: constants.HOSTED_ZONE_ID,
	});

	const { cluster, service } = MinecraftECS(stack, {
		memorySize: constants.MEMORY_SIZE,
		cpuSize: constants.CPU_SIZE,
		vpc,
		securityGroup,
		startupMin: constants.STARTUP_MIN,
		shutdownMin: constants.SHUTDOWN_MIN,
		serverConfig: config,
		subDomainHostedZoneId: subDomainZoneId,
		serverSubDomain: SERVER_SUB_DOMAIN,
		domain: constants.DOMAIN,
		hostedZoneId: constants.HOSTED_ZONE_ID,
		minecraftEdition: constants.MINECRAFT_EDITION,
		eventBusName: eventBus.eventBusName,
	});

	MinecraftLambda(stack, {
		cluster,
		service,
		eventBus,
		stage: app.stage,
	});
}
