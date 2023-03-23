import { StackContext, EventBus } from "sst/constructs";

export function DiscordEventBus({ stack }: StackContext) {
	const eventBus = new EventBus(stack, "DiscordEventBus");
	return { eventBus };
}
