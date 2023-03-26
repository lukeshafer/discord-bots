import { ECS } from "aws-sdk";
import { Config } from "sst/node/config";

export async function main() {
	const ecs = new ECS();
	const service = await ecs
		.describeServices({
			cluster: Config.CLUSTER_NAME,
			services: [Config.SERVICE_NAME],
		})
		.promise();

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
