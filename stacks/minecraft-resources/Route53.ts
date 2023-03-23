import {
	// RemovalPolicy,
	Duration,
} from "aws-cdk-lib";
//import { PolicyStatement, ServicePrincipal } from "aws-cdk-lib/aws-iam";
//import { LogGroup, ResourcePolicy, RetentionDays } from "aws-cdk-lib/aws-logs";
import { HostedZone, ARecord, NsRecord } from "aws-cdk-lib/aws-route53";
import { Stack } from "sst/constructs";

export function MinecraftRoute53(
	stack: Stack,
	props: {
		serverSubDomain: string;
		domain: string;
		hostedZoneId: string;
	}
) {
	const hostedZone = HostedZone.fromHostedZoneAttributes(stack, "HostedZone", {
		zoneName: props.domain,
		hostedZoneId: props.hostedZoneId,
	});

	const subdomainHostedZone = new HostedZone(stack, "SubdomainHostedZone", {
		zoneName: props.serverSubDomain + "." + props.domain,
		//queryLogsLogGroupArn: queryLogGroup.logGroupArn,
	});

	new NsRecord(stack, "SubdomainNsRecord", {
		zone: hostedZone,
		values: subdomainHostedZone.hostedZoneNameServers as string[],
		recordName: props.serverSubDomain + "." + props.domain,
	});

	new ARecord(stack, "clientSiteARecord", {
		zone: subdomainHostedZone,
		target: { values: ["192.168.1.1"] },
		ttl: Duration.seconds(30),
		recordName: props.serverSubDomain + "." + props.domain,
	});

	const subDomainZoneId = subdomainHostedZone.hostedZoneId;

	return { subDomainZoneId };
}
