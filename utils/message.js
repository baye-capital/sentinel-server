const axios = require("axios");

exports.sendSms = async (del) => {
  const phoneNo =
    del.phoneNo[0] === "+"
      ? del.phoneNo
      : del.phoneNo[0] === "0"
      ? "+234" + del.phoneNo.slice(1)
      : "+234" + del.phoneNo;
  await axios("https://api.ng.termii.com/api/sms/send", {
    method: "POST",
    data: {
      to: phoneNo,
      sms: del.message,
      channel: "dnd",
      api_key: process.env.TERMII_API_KEY,
      from: "N-Alert",
      type: "plain",
    },
  });
};
