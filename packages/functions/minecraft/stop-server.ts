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
