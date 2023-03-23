import {
	aws_ecs as ecs,
	aws_ec2 as ec2,
	aws_efs as efs,
	RemovalPolicy,
} from "aws-cdk-lib";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { Api, Config, type StackContext } from "sst/constructs";

export function Minecraft({ stack }: StackContext) {
	const props = {
		port: 25565,
		containerEnvironment: {
			EULA: "TRUE",
		},
		enableAutomaticBackups: true,
	};

	const server = new ApplicationLoadBalancedFargateService(stack, "Minecraft", {
		cpu: 512,
		memoryLimitMiB: 2048,
		taskImageOptions: {
			image: ecs.ContainerImage.fromRegistry(
				"marctv/minecraft-papermc-server:latest"
			),
			containerName: "MinecraftServer",
			environment: props.containerEnvironment,
		},
	});

	server.cluster.connections.allowFromAnyIpv4(ec2.Port.tcp(props.port));

	// File System
	const fileSystem = new efs.FileSystem(stack, "ServerFiles", {
		vpc: server.cluster.vpc,
		encrypted: true,
		enableAutomaticBackups: props.enableAutomaticBackups,
		lifecyclePolicy: efs.LifecyclePolicy.AFTER_7_DAYS,
		removalPolicy: RemovalPolicy.DESTROY,
	});
	fileSystem.connections.allowDefaultPortFrom(server.cluster);

	server.taskDefinition.addVolume({
		name: "ServerFiles",
		efsVolumeConfiguration: {
			fileSystemId: fileSystem.fileSystemId,
		},
	});

	server.taskDefinition.defaultContainer?.addMountPoints({
		containerPath: "/data",
		readOnly: false,
		sourceVolume: "ServerFiles",
	});

	const api = new Api(stack, "MinecraftApi", {
		routes: {
			"POST /start": "packages/functions/minecraft.start",
			"POST /stop": "packages/functions/minecraft.stop",
		},
		defaults: {
			function: {
				vpc: server.cluster.vpc,
				bind: [
					new Config.Parameter(stack, "MINECRAFT_TASK_ARN", {
						value: server.service.taskDefinition.taskDefinitionArn,
					}),
					new Config.Parameter(stack, "MINECRAFT_CLUSTER_ARN", {
						value: server.cluster.clusterArn,
					}),
				],
			},
		},
	});

	stack.addOutputs({
		ApiEndpoint: api.url,
	});
}
