export function monthNumToName(month: number) {
	return monthNames[month - 1];
}

const monthNames = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

export function numberSuffix(val: number | string) {
	if (Number.isNaN(Number(val))) return "";

	const last2 = +`${val}`.slice(-2);
	if (last2 > 10 && last2 < 14) return "th";
	const stringVal = `${val}`;
	const last = stringVal[stringVal.length - 1];
	return last === "1" ? "st" : last === "2" ? "nd" : last === "3" ? "rd" : "th";
}

export function getZodiacSign(month: number, day: number) {
	const sign = signDates.find(([, { start, end }]) => {
		const [startMonth, startDay] = start;
		const [endMonth, endDay] = end;

		if (month === startMonth && day >= startDay) return true;
		if (month === endMonth && day <= endDay) return true;
		return false;
	});
	return sign ? sign[0] : "Unknown";
}

export const signDates = [
	["Aries", { start: [3, 21], end: [4, 19] }],
	["Taurus", { start: [4, 20], end: [5, 20] }],
	["Gemini", { start: [5, 21], end: [6, 20] }],
	["Cancer", { start: [6, 21], end: [7, 22] }],
	["Leo", { start: [7, 23], end: [8, 22] }],
	["Virgo", { start: [8, 23], end: [9, 22] }],
	["Libra", { start: [9, 23], end: [10, 22] }],
	["Scorpio", { start: [10, 23], end: [11, 21] }],
	["Sagittarius", { start: [11, 22], end: [12, 21] }],
	["Capricorn", { start: [12, 22], end: [1, 19] }],
	["Aquarius", { start: [1, 20], end: [2, 18] }],
	["Pisces", { start: [2, 19], end: [3, 20] }],
] as const;
