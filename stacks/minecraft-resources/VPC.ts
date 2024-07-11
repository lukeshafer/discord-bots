import {
	SecurityGroup,
	Peer,
	Port,
	SubnetType,
	Vpc,
} from "aws-cdk-lib/aws-ec2";
import { Stack } from "sst/constructs";

export function MinecraftVPC(
	stack: Stack,
	props: {
		ingressRule: Port;
    vcIngressRule: Port;
	}
) {
	const vpc = new Vpc(stack, "MinecraftVPC", {
		natGateways: 0,
		subnetConfiguration: [
			{
				cidrMask: 24,
				name: "MinecraftPublic",
				subnetType: SubnetType.PUBLIC,
				mapPublicIpOnLaunch: true,
			},
		],
		maxAzs: 2,
	});

	const securityGroup = new SecurityGroup(stack, "MinecraftSecurityGroup", {
		vpc,
		description: "Security Group for Minecraft Server",
		allowAllOutbound: true,
	});

	securityGroup.addIngressRule(Peer.anyIpv4(), props.ingressRule);
	securityGroup.addIngressRule(Peer.anyIpv4(), props.vcIngressRule);

	return {
		vpc,
		securityGroup,
	};
}
