export default {
	VOLUME_NAME: "minecraft",
	MINECRAFT_EDITION: "java",
	PORT: 25565,
	HOSTED_ZONE_ID: "Z026947811UUN3L0HCA12",
	DOMAIN: "lksh.dev",
	SERVER_SUB_DOMAIN: "minecraft",
	MEMORY_SIZE: "4096",
	CPU_SIZE: "2048",
	STARTUP_MIN: "10",
	SHUTDOWN_MIN: "20",
	DEBUG: true,
	IMAGE: "itzg/minecraft-server",
} as const;
