import {
	Vpc,
	Instance,
	InstanceType,
	InstanceClass,
	InstanceSize,
	MachineImage,
} from "aws-cdk-lib/aws-ec2";
import type { Stack } from "sst/constructs";

export function MinecraftEC2(
	stack: Stack,
	props: {
		vpc: Vpc;
	}
) {
	const instance = new Instance(stack, "MinecraftManager", {
		vpc: props.vpc,
		instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
		machineImage: MachineImage.latestAmazonLinux(),
		keyName: "Macbook Pro",
	});
}
