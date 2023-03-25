import { setbirthday } from "./slash-commands/birthdays";
import type { SlashCommandBuilder } from "discord.js";
import type { Interaction } from "./discord-client";
import {
	InteractionResponseType,
	type APIApplicationCommandInteraction,
	type MessageFlags,
} from "discord-api-types/v10";

const commands = [setbirthday]satisfies Command[];

export function getCommandsForRegistration() {
	return commands.map(({ data }) => data);
}

export async function executeCommand(
	interaction: Interaction<APIApplicationCommandInteraction>
) {
	const command = commands.find(
		(command) => command.data.name === interaction.data.name
	);
	if (!command) {
		throw new Error(`Command not found: ${interaction.data.name}`);
	}

	return await command.execute(interaction);
}

export interface Command {
	data: Partial<SlashCommandBuilder>;
	execute: (interaction: Interaction<any>) => Promise<any>;
}

interface InteractionResponseData {
	tts?: boolean;
	content?: string;
	embeds?: any[];
	flags?: MessageFlags.Ephemeral;
}

export interface InteractionResponse {
	type: InteractionResponseType;
	data?: InteractionResponseData;
}

export function createMessageResponse(response: InteractionResponseData) {
	return {
		type: InteractionResponseType.ChannelMessageWithSource,
		data: response,
	};
}
