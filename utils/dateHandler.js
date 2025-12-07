const moment = require("moment-timezone");

exports.getDateBounds = () => {
  const today = moment().tz("Africa/Lagos");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = today.month();
  const year = today.year();
  const day = today.date();
  const days = today.daysInMonth();

  const startOfDay = moment
    .tz([year, month, day], "Africa/Lagos")
    .startOf("day");

  const startOfWeek = moment
    .tz([year, month, day], "Africa/Lagos")
    .startOf("week");

  const startOfLastMonth = moment
    .tz([year, normalizeMonth(month - 1)], "Africa/Lagos")
    .startOf("month");
  const endOfLastMonthObj = moment.tz(
    [year, normalizeMonth(month - 1)],
    "Africa/Lagos"
  );
  const endOfLastMonth = endOfLastMonthObj.endOf("month");
  const startOfMonth = moment
    .tz([year, month], "Africa/Lagos")
    .startOf("month");
  const endOfMonthObj = moment.tz([year, month], "Africa/Lagos");
  const endOfMonth = endOfMonthObj.endOf("month");

  const startOfYear = moment.tz("Africa/Lagos").year(year).startOf("year");
  const endOfYear = moment.tz("Africa/Lagos").year(year).endOf("year");

  return {
    startOfDay,
    startOfWeek,
    startOfLastMonth,
    endOfLastMonth,
    startOfMonth,
    endOfMonth,
    month: months[month],
    startOfYear,
    endOfYear,
    months,
    days,
    monthNo: month,
  };
};

function normalizeMonth(month) {
  let normalizedMonth = month % 12;
  if (normalizedMonth < 0) {
    normalizedMonth += 12;
  }

  return normalizedMonth;
}

exports.parts = (month, days) => {
  if (month === 1) {
    const extra = days - 18;
    if (extra === 11) {
      return {
        main: 2,
        extra: [3, 4, 4],
      };
    } else {
      return {
        main: 2,
        extra: [3, 3, 4],
      };
    }
  } else {
    const extra = days - 27;
    if (extra === 4) {
      return {
        main: 3,
        extra: [1, 2, 1],
      };
    } else {
      return {
        main: 3,
        extra: [1, 1, 1],
      };
    }
  }
};

exports.randomNumbers = () => {
  const numbers = [];
  while (numbers.length < 3) {
    const randomNum = Math.floor(Math.random() * (12 - 1 + 1)) + 1;
    if (!numbers.includes(randomNum)) {
      numbers.push(randomNum);
    }
  }

  return numbers;
};

exports.parseFieldIfString = (field) => {
  // Return as-is if already an object/array or undefined/null
  if (!field || typeof field !== "string") {
    return field;
  }
  
  // Return as-is if empty string
  if (field.trim() === "") {
    return field;
  }
  
  try {
    return JSON.parse(field);
  } catch (error) {
    console.error("Error parsing field:", error);
    return field; // Return original string if parsing fails
  }
};
