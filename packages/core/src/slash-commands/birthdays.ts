import { Table } from "sst/node/table";
import { DynamoDB } from "aws-sdk";
import { SlashCommandBuilder } from "discord.js";
import type { CommandInteraction } from "discord.js";

const dynamoDb = new DynamoDB.DocumentClient();

export const getbirthdays = {
	data: new SlashCommandBuilder()
		.setName("getbirthdays")
		.setDescription("Get all birthdays"),
	execute: async (interaction: CommandInteraction) => {
		await interaction.reply("Getting birthdays...");
		const scanParams: DynamoDB.DocumentClient.ScanInput = {
			TableName: Table.Birthdays.tableName,
		};

		const results = await dynamoDb
			.scan(scanParams)
			.promise()
			.then((res) => res.Items);

		await interaction.editReply(JSON.stringify(results));
	},
};

export async function setBirthday(userId: string, birthday: string) {
	const putParams: DynamoDB.DocumentClient.PutItemInput = {
		TableName: Table.Birthdays.tableName,
		Item: {
			userId,
			birthday,
		},
	};

	const result = await dynamoDb.put(putParams).promise();

	return result;
}
