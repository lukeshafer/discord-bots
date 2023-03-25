import { Table } from "sst/node/table";
import { DynamoDB } from "aws-sdk";
import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	SlashCommandBuilder,
	MessageFlags,
	APIApplicationCommandInteraction,
} from "discord.js";
import type { Command } from "../commands";
import { Interaction } from "../discord-client";

const dynamoDb = new DynamoDB.DocumentClient();

export const getbirthdays = {
	data: new SlashCommandBuilder()
		.setName("getbirthdays")
		.setDescription("Get all birthdays"),
	execute: async (interaction: Interaction) => {
		const deferPromise = interaction.defer(true);

		const scanParams: DynamoDB.DocumentClient.ScanInput = {
			TableName: Table.Users.tableName,
		};

		const results = await dynamoDb
			.scan(scanParams)
			.promise()
			.then((res) => res.Items);

		const birthdays = results?.map((result) => {
			const { userId, month, day, year } = result;
			if (year) return `<@${userId}>: ${month}/${day}/${year}`;
			return `<@${userId}>: ${month}/${day}`;
		});

		await deferPromise;
		if (birthdays) {
			await interaction.editResponse({
				content: birthdays.join("\n"),
				flags: MessageFlags.Ephemeral,
			});
		} else {
			await interaction.editResponse({
				content: "No birthdays found",
				flags: MessageFlags.Ephemeral,
			});
		}
	},
} satisfies Command;

export const setbirthday = {
	data: new SlashCommandBuilder()
		.setName("setmybirthday")
		.setDescription("Set your birthday")
		.addIntegerOption((option) =>
			option
				.setName("month")
				.setDescription("Month")
				.setRequired(true)
				.setMinValue(1)
				.setMaxValue(12)
		)
		.addIntegerOption((option) =>
			option.setName("day").setDescription("Day").setRequired(true)
		)
		.addIntegerOption((option) =>
			option.setName("year").setDescription("Year").setRequired(false)
		),
	execute: async (
		interaction: Interaction<APIApplicationCommandInteraction>
	) => {
		if (
			interaction.data?.type !== ApplicationCommandType.ChatInput ||
			!interaction.data.options ||
			!interaction.interaction.member?.user
		) {
			console.error("Invalid interaction", interaction.interaction);
			await interaction.sendResponse({
				content: "Invalid command",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
		const deferPromise = interaction.defer(true);

		const { month, day, year } = interaction.data.options.reduce(
			(acc, option) => {
				if (option.type !== ApplicationCommandOptionType.Integer) return acc;
				if (option.name === "month") {
					acc.month = option.value;
				} else if (option.name === "day") {
					acc.day = option.value;
				} else if (option.name === "year") {
					acc.year = option.value;
				}
				return acc;
			},
			{ month: 0, day: 0, year: undefined as number | undefined }
		);

		if (
			month < 1 ||
			month > 12 ||
			day < 1 ||
			day > 31 ||
			(year && (year < 1900 || year > new Date().getFullYear()))
		) {
			await deferPromise;
			await interaction.editResponse({
				content: "Invalid date",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const putParams: DynamoDB.DocumentClient.PutItemInput = {
			TableName: Table.Users.tableName,
			Item: {
				userId: interaction.interaction.member.user.id,
				month,
				day,
				year: year ?? "",
			},
		};

		await dynamoDb.put(putParams).promise();
		await deferPromise;
		await interaction.editResponse({
			content: `Set birthday for ${interaction.interaction.member?.user.username
				} to ${month}/${day}${year ? `/${year}` : ""}`,
			flags: MessageFlags.Ephemeral,
		});
	},
} satisfies Command;
