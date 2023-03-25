import { Table } from "sst/node/table";
import { DynamoDB } from "aws-sdk";
import { sendMessage } from "@discord-bots/core/discord-client";
import { Config } from "sst/node/config";

const dynamoDb = new DynamoDB.DocumentClient();

export const main = async () => {
	const tableData = await getBirthdaysFromDynamoDb();
	if (!tableData) return;

	const today = new Date();
	const birthdays = tableData.filter((result) => {
		const month = Number(result.month);
		const day = Number(result.day);

		return month === today.getMonth() + 1 && day === today.getDate();
	});

	if (birthdays.length === 0) return;

	await sendMessage({
		channelId: Config.BIRTHDAY_ANNOUNCE_CHANNEL,
		body: {
			content: getBirthdayMessageFromBirthdays(birthdays),
		},
	});
};

async function getBirthdaysFromDynamoDb() {
	const scanParams: DynamoDB.DocumentClient.ScanInput = {
		TableName: Table.Users.tableName,
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
			const last = age ? age[age.length - 1] : "";
			const suffix =
				last === "1" ? "st" : last === "2" ? "nd" : last === "3" ? "rd" : "th";
			age = `${String(today.getFullYear() - Number(year))}${suffix} `;
		}

		const message = `Hey everyone, it's <@${userId}>'s ${age}birthday!!!`;
		return message;
	}

	return birthdays.reduce((acc, birthday) => {
		const { year, userId } = birthday;
		if (!year) return `${acc}Happy birthday <@${userId}>!\n`;
		const age = String(today.getFullYear() - Number(year));
		const last = age ? age[age.length - 1] : "";
		const suffix =
			last === "1" ? "st" : last === "2" ? "nd" : last === "3" ? "rd" : "th";
		const msgAge = `${age}${suffix} `;
		return `${acc}Happy ${msgAge} birthday <@${userId}>! \n`;
	}, `Hey everyone! We have ${birthdays.length} birthdays today!!! \n`);
}
