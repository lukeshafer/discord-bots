import { Table } from "sst/node/table";
import { DynamoDB } from "aws-sdk";
import {
	sendMessage,
	removeAbsentUsers,
} from "@discord-bots/core/discord-client";
import {
	numberSuffix,
	signDates,
	getZodiacSign,
} from "@discord-bots/core/utils";
import { Config } from "sst/node/config";
const dynamoDb = new DynamoDB.DocumentClient();
const today = new Date();

export const main = async () => {
	const tableData = await getBirthdaysFromDynamoDb();
	if (!tableData) return;

	// check if today is the start date of a sign
	const sign = signDates.find(
		(sign) =>
			sign[1].start[0] === today.getMonth() + 1 &&
			sign[1].start[1] === today.getDate() - 5 //  + 1
	);

	const guildId = tableData[0]?.guildId as string;

	const userIds = tableData.map(({ userId }) => userId);

	await removeAbsentUsers(userIds, guildId);

	await sendBirthdaysToday(tableData);

	if (sign) await sendBirthdaysThisSeason(sign[0], tableData);
};

async function sendBirthdaysToday(tableData: any[]) {
	const today = new Date();
	const birthdaysToday = tableData.filter((result) => {
		const month = Number(result.month);
		const day = Number(result.day);

		return month === today.getMonth() + 1 && day === today.getDate();
	});

	if (birthdaysToday.length === 0) return;

	const birthdayMessage = getBirthdayMessageFromBirthdays(birthdaysToday);

	await sendMessage({
		channelId: Config.BIRTHDAY_ANNOUNCE_CHANNEL,
		body: {
			content: `${birthdayMessage}\n\nAs a reminder, you can set your birthday to be announced in this channel by using the \`/setmybirthday\` command!\n`,
		},
	});
}

async function sendBirthdaysThisSeason(signName: string, tableData: any[]) {
	const message = `Tomorrow is the start of **${signName}** season! Here are the upcoming ${signName} birthdays:`;
	const birthdaysThisSeason = tableData.filter((result) => {
		const month = Number(result.month);
		const day = Number(result.day);

		const sign = getZodiacSign(month, day);
		return sign === signName;
	});

	const birthdaysString = birthdaysThisSeason
		.map((result) => {
			const { userId, month, day } = result;
			const bdayString = `${month}/${day}: <@${userId}>`;
			return bdayString;
		})
		.join("\n");

	await sendMessage({
		channelId: Config.BIRTHDAY_ANNOUNCE_CHANNEL,
		body: {
			content: `${message}\n\n${birthdaysString}`,
		},
	});
}

async function getBirthdaysFromDynamoDb() {
	const scanParams: DynamoDB.DocumentClient.ScanInput = {
		TableName: Table.GuildUsers.tableName,
	};

	return dynamoDb
		.scan(scanParams)
		.promise()
		.then((res) => res.Items);
}

function getBirthdayMessageFromBirthdays(birthdays: any[]): string {
	const today = new Date();

	if (birthdays.length === 1) {
		const { userId, year } = birthdays[0];
		let age = "";
		if (year) {
			const suffix = numberSuffix(age);
			age = `${String(today.getFullYear() - Number(year))}${suffix} `;
		}

		const message = `Hey everyone, it's <@${userId}>'s ${age}birthday!!!`;
		return message;
	}

	return birthdays.reduce((acc, birthday) => {
		const { year, userId } = birthday;
		if (!year) return `${acc}Happy birthday <@${userId}>!\n`;
		const age = String(today.getFullYear() - Number(year));
		const suffix = numberSuffix(age);
		const msgAge = `${age}${suffix} `;
		return `${acc}Happy ${msgAge} birthday <@${userId}>! \n`;
	}, `Hey everyone! We have ${birthdays.length} birthdays today!!! \n`);
}
