import { RemovalPolicy } from "aws-cdk-lib";
import { SubnetType, Vpc, SecurityGroup } from "aws-cdk-lib/aws-ec2";
import {
	AwsLogDriver,
	Cluster,
	ContainerImage,
	CpuArchitecture,
	FargateService,
	FargateTaskDefinition,
	OperatingSystemFamily,
} from "aws-cdk-lib/aws-ecs";
import { AccessPoint, FileSystem } from "aws-cdk-lib/aws-efs";
import {
	Role,
	Policy,
	PolicyDocument,
	PolicyStatement,
	ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { ServerConfig } from "../Minecraft";
import type { Stack } from "sst/constructs";

export function MinecraftECS(
	stack: Stack,
	props: {
		vpc: Vpc;
		securityGroup: SecurityGroup;
		memorySize: string;
		cpuSize: string;
		minecraftEdition: string;
		startupMin: string;
		shutdownMin: string;
		serverConfig: ServerConfig;
		serverSubDomain: string;
		domain: string;
		hostedZoneId: string;
		subDomainHostedZoneId: string;
		eventBusName: string;
	}
) {
	const cluster = new Cluster(stack, "MinecraftCluster", {
		vpc: props.vpc,
		containerInsights: true,
		enableFargateCapacityProviders: true,
	});

	const fileSystem = new FileSystem(stack, "MinecraftFileSystem", {
		vpc: props.vpc,
		removalPolicy: RemovalPolicy.RETAIN,
	});

	const accessPoint = new AccessPoint(stack, "MinecraftAccessPoint", {
		fileSystem: fileSystem,
		path: "/minecraft",
		posixUser: {
			uid: "1000",
			gid: "1000",
		},
		createAcl: {
			ownerGid: "1000",
			ownerUid: "1000",
			permissions: "0750",
		},
	});

	const minecraftTaskRole = new Role(stack, "MinecraftTaskRole", {
		assumedBy: new ServicePrincipal("ecs-tasks.amazonaws.com"),
		inlinePolicies: {
			minecraftTaskPolicy: new PolicyDocument({
				statements: [
					new PolicyStatement({
						resources: ["*"],
						actions: [
							"elasticfilesystem:ClientMount",
							"elasticfilesystem:ClientWrite",
							"elasticfilesystem:DescribeFileSystems",
						],
					}),
				],
			}),
		},
	});

	const task = new FargateTaskDefinition(stack, "MinecraftTask", {
		memoryLimitMiB: Number(props.memorySize),
		cpu: Number(props.cpuSize),
		runtimePlatform: {
			operatingSystemFamily: OperatingSystemFamily.LINUX,
			cpuArchitecture: CpuArchitecture.X86_64,
		},
		taskRole: minecraftTaskRole,
		volumes: [
			{
				name: "minecraft",
				efsVolumeConfiguration: {
					fileSystemId: fileSystem.fileSystemId,
					transitEncryption: "ENABLED",
					authorizationConfig: {
						accessPointId: accessPoint.accessPointId,
						iam: "ENABLED",
					},
				},
			},
		],
	});

	const service = new FargateService(stack, "FargateService", {
		serviceName: "MineCraftService",
		cluster,
		capacityProviderStrategies: [
			{
				capacityProvider: "FARGATE",
				weight: 1,
				base: 1,
			},
		],
		taskDefinition: task,
		assignPublicIp: true,
		desiredCount: 0,
		vpcSubnets: { subnetType: SubnetType.PUBLIC },
		securityGroups: [props.securityGroup],
		enableExecuteCommand: true,
	});

	const minecraftServerContainer = task.addContainer(
		"MinecraftServerContainer",
		{
			image: ContainerImage.fromRegistry(props.serverConfig.image),
			environment: {
				EULA: "TRUE",
				MEMORY: "3G",
			},
			portMappings: [
				{
					containerPort: props.serverConfig.port,
					hostPort: props.serverConfig.port,
					protocol: props.serverConfig.protocol,
				},
			],
			essential: false,
			logging: props.serverConfig.debug
				? new AwsLogDriver({
						logRetention: RetentionDays.THREE_DAYS,
						streamPrefix: "minecraft",
				  })
				: undefined,
		}
	);

	minecraftServerContainer.addMountPoints({
		containerPath: "/data",
		sourceVolume: "minecraft",
		readOnly: false,
	});

	task.addContainer("WatchdogContainer", {
		image: ContainerImage.fromAsset(
			"./stacks/minecraft-resources/watchdogContainer-0-8"
		),
		essential: true,
		environment: {
			CLUSTER: cluster.clusterName,
			SERVICE: "MineCraftService",
			DNSZONE: props.subDomainHostedZoneId,
			SERVERNAME: `${props.serverSubDomain}.${props.domain}`,
			STARTUPMIN: props.startupMin,
			SHUTDOWNMIN: props.shutdownMin,
			SNSTOPIC: "",
			EVENTBUS: props.eventBusName,
		},
		logging: props.serverConfig.debug
			? new AwsLogDriver({
					logRetention: RetentionDays.THREE_DAYS,
					streamPrefix: "watchdog",
			  })
			: undefined,
	});

	const serverPolicy = new Policy(stack, "ServerPolicy", {
		statements: [
			new PolicyStatement({
				actions: ["ecs:DescribeTasks"],
				resources: ["*"],
			}),
			new PolicyStatement({
				actions: ["ecs:*"],
				resources: [
					task.taskDefinitionArn,
					`${task.taskDefinitionArn}:/*`,
					service.serviceArn,
					`${service.serviceArn}:/*`,
					cluster.clusterArn,
					`${cluster.clusterArn}:/*`,
				],
			}),
			new PolicyStatement({
				actions: ["ec2:DescribeNetworkInterfaces"],
				resources: ["*"],
			}),
			new PolicyStatement({
				actions: ["events:PutEvents"],
				resources: ["*"],
			}),
			new PolicyStatement({
				actions: [
					"route53:GetHostedZone",
					"route53:ChangeResourceRecordSets",
					"route53:ListResourceRecordSets",
				],
				resources: [
					`arn:aws:route53:::hostedzone/${props.subDomainHostedZoneId}`,
				],
			}),
		],
	});
	serverPolicy.attachToRole(minecraftTaskRole);

	fileSystem.connections.allowDefaultPortFrom(service.connections);
	return { service, cluster };
}
