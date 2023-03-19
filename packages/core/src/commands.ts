import { getbirthdays, setbirthday } from "./slash-commands/birthdays";
import fetch from "node-fetch";
import type { SlashCommandBuilder } from "discord.js";
import type { Interaction } from "./interaction-client";
import type { APIApplicationCommandInteraction } from "discord-api-types/v10";
import { InteractionResponseType, MessageFlags } from "discord-api-types/v10";

const commands = [getbirthdays, setbirthday] satisfies Command[];

export function getCommandsForRegistration() {
	return commands.map(({ data }) => data);
}

export async function executeCommand(interaction: Interaction) {
	const command = commands.find(
		(command) => command.data.name === interaction.name
	);
	if (!command) {
		throw new Error(`Command not found: ${interaction.name}`);
	}

	return await command.execute(interaction);
}

export interface Command {
	data: Partial<SlashCommandBuilder>;
	execute: (interaction: Interaction) => Promise<any>;
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
