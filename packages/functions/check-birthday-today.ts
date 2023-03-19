import { Table } from "sst/node/table";
import { DynamoDB } from "aws-sdk";

const dynamoDb = new DynamoDB.DocumentClient();

export const main = async () => {
	const scanParams: DynamoDB.DocumentClient.ScanInput = {
		TableName: Table.Birthdays.tableName,
	};

	const results = await dynamoDb
		.scan(scanParams)
		.promise()
		.then((res) => res.Items);

	if (!results) return;

	const today = new Date();

	const birthdays = results.filter((result) => {
		const month = Number(result.month);
		const day = Number(result.day);

		return month === today.getMonth() + 1 && day === today.getDate();
	});

	console.log(birthdays);
	if (birthdays.length === 0) return;

	if (birthdays.length === 1) {
		const { userId, year } = birthdays[0];

		if (!year)
			return {
				statusCode: 200,
				body: `HAPPY BIRTHDAY <@${userId}>!`,
			};

		const age = today.getFullYear() - Number(year);

		return {
			statusCode: 200,
			body: `HAPPY BIRTHDAY <@${userId}> - ${age} years old!`,
		};
	}

	const message = birthdays.reduce((acc, birthday) => {
		const { year, userId } = birthday;
		if (!year) return `${acc} <@${userId}> \n`;
		const age = today.getFullYear() - Number(year);
		return `${acc} <@${userId}> - ${age} years old! \n`;
	}, "HAPPY SHARED BIRTHDAY TO: \n");

	console.log(message);
	return {
		statusCode: 200,
		body: message,
	};
};
