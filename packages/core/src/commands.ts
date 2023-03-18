import { getbirthdays } from "./slash-commands/birthdays";
import type { CommandInteraction, SlashCommandBuilder } from "discord.js";

interface Command {
	data: SlashCommandBuilder;
	execute: (interaction: CommandInteraction) => any;
}

const commands = [getbirthdays]satisfies Command[];

export function getCommandsForRegistration() {
	return commands.map(({ data }) => data);
}

export async function executeCommand(interaction: CommandInteraction) {
	const name = interaction.commandName;
	const command = commands.find((command) => command.data.name === name);
	if (!command) {
		throw new Error(`Command not found: ${name}`);
	}

	return command.execute(interaction);
}
