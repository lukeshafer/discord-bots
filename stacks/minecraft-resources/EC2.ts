import {
	Vpc,
	Instance,
	InstanceType,
	InstanceClass,
	InstanceSize,
	MachineImage,
	SecurityGroup,
	Peer,
	Port,
} from "aws-cdk-lib/aws-ec2";
import { FileSystem } from "aws-cdk-lib/aws-efs";
import type { Stack } from "sst/constructs";

export function MinecraftEC2(
	stack: Stack,
	props: {
		vpc: Vpc;
    fileSystem: FileSystem
	},
) {
	const securityGroup = new SecurityGroup(
		stack,
		"MinecraftManagerSecurityGroup",
		{
			vpc: props.vpc,
		},
	);

	securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(22));

	const instance = new Instance(stack, "MinecraftManager", {
		vpc: props.vpc,
		instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
		machineImage: MachineImage.latestAmazonLinux2023(),
		keyName: "WSL Arch Linux 2024",
		instanceName: `${stack.stage} minecraft manager`,
		securityGroup,
	});

	props.fileSystem.connections.allowDefaultPortFrom(instance.connections);

	return { instance, securityGroup };
}
