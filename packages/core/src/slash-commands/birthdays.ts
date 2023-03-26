import { Table } from "sst/node/table";
import { DynamoDB } from "aws-sdk";
import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	SlashCommandBuilder,
	MessageFlags,
	APIApplicationCommandInteraction,
	APIChatInputApplicationCommandInteractionData,
} from "discord.js";
import type { Command } from "../commands";
import { Interaction } from "../discord-client";
import { monthNumToName, getZodiacSign, signDates } from "../utils";

const dynamoDb = new DynamoDB.DocumentClient();

export const getbirthdays = {
	data: new SlashCommandBuilder()
		.setName("getbirthdays")
		.setDescription("Get all birthdays")
		.addStringOption((option) =>
			option
				.setName("groupby")
				.setDescription("Group by")
				.setRequired(false)
				.addChoices(
					{ name: "Sign (default)", value: "sign" },
					{ name: "Month", value: "month" }
				)
		),
	execute: async (interaction: Interaction) => {
		const deferPromise = interaction.defer(true);

		const data =
			interaction.data as APIChatInputApplicationCommandInteractionData;

		const validGroups = ["sign", "month"] as const;
		const groupBy = ((): (typeof validGroups)[number] => {
			const group = data.options?.find((option) => option.name === "groupby");
			if (group?.type !== ApplicationCommandOptionType.String) {
				return "sign";
			}
			for (const validGroup of validGroups)
				if (group.value === validGroup) return validGroup;

			return "sign";
		})();

		const getGroup = (month: number, day: number) => {
			if (groupBy === "month") return monthNumToName(month);
			return getZodiacSign(month, day);
		};

		const scanParams: DynamoDB.DocumentClient.ScanInput = {
			TableName: Table.GuildUsers.tableName,
		};

		const results = await dynamoDb
			.scan(scanParams)
			.promise()
			.then((res) => res.Items);

		let currentGroup = "";
		const [startMonth, startDay] =
			groupBy === "month"
				? ([1, 1] as const)
				: ([signDates[0][1].start[0], signDates[0][1].start[1]] as const);
		const birthdays = results
			?.sort((a, b) => {
				const aMonth =
					Number(a.month) +
					(a.month < startMonth || (a.month === startMonth && a.day < startDay)
						? 12
						: 0);
				const bMonth =
					Number(b.month) +
					(b.month < startMonth || (b.month === startMonth && b.day < startDay)
						? 12
						: 0);
				const aDay = Number(a.day);
				const bDay = Number(b.day);

				if (aMonth < bMonth) return -1;
				if (aMonth > bMonth) return 1;
				if (aDay < bDay) return -1;
				if (aDay > bDay) return 1;
				return 0;
			})
			.map((result) => {
				const { userId, month, day } = result;
				const bdayString = `${month}/${day}: <@${userId}>`;
				const group = getGroup(Number(month), Number(day));

				if (currentGroup !== group) {
					currentGroup = group;
					return `\n**${group}:**\n${bdayString}`;
				}
				return bdayString;
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
			TableName: Table.GuildUsers.tableName,
			Item: {
				userId: interaction.interaction.member.user.id,
				guildId: interaction.interaction.guild_id,
				month,
				day,
				year: year ?? "",
			},
		};

		await dynamoDb.put(putParams).promise();
		await deferPromise;
		await interaction.editResponse({
			content: `Set birthday for ${
				interaction.interaction.member?.user.username
			} to ${month}/${day}${year ? `/${year}` : ""}`,
			flags: MessageFlags.Ephemeral,
		});
	},
} satisfies Command;
