const crypto = require("crypto");
const axios = require("axios");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Event = require("../models/Event");
const User = require("../models/User");
const Insurance = require("../models/Insurance");
const Inspection = require("../models/Inspection");
const Building = require("../models/Building");
const PayKadunaMotorMarket = require("../utils/payment");

// @desc    Initialize a transaction
// @route   POST /api/v1/payments
// @access  Private
exports.initializeTransaction = asyncHandler(async (req, res, next) => {
  // create insurance
  const user = req.body.user;
  const existing = await User.findOne({ email: user.email });
  console.log(existing); 
  if (existing) {
    var newUser = await User.findByIdAndUpdate(existing._id, user, {
      new: true,
      runValidators: true,
    });
    console.log("here");
  } else {
    var newUser = await User.create(user);
    console.log("here2");
  }
  delete req.body.user;
  req.body.user = newUser._id;
  req.body.address = newUser.street + " " + newUser.city;
  req.body.state = newUser.state;
  req.body.createdBy = req.user._id;
  const insurance = await Insurance.create(req.body);

  if (!newUser || !insurance) {
    return next(
      new ErrorResponse(
        `Could not process your request at this time. Please try again later`,
        404
      )
    );
  }

  const options = JSON.stringify({
    email: newUser.email,
    amount: insurance.price * 100,
    metadata: {
      insurance_id: insurance._id,
      reason: "Insurance Payment",
    },
  });

  // Initialize Transaction
  const initalize_transaction_url =
    "https://api.paystack.co/transaction/initialize";
  const transaction = await axios(initalize_transaction_url, {
    method: "POST",
    data: options,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });

  // Change this to res.redirect
  res.status(200).json({
    success: true,
    data: transaction.data,
  });
});

// @desc    Initialize a transaction
// @route   POST /api/v1/payments
// @access  Private
exports.initializeTransactionInspection = asyncHandler(
  async (req, res, next) => {
    // create insurance
    const user = req.body.user;
    const existing = await User.findOne({ email: user.email });

    if (existing) {
      var newUser = await User.findByIdAndUpdate(existing._id, user, {
        new: true,
        runValidators: true,
      });
    } else {
      var newUser = await User.create(user);
    }
    delete req.body.user;
    req.body.user = newUser._id;
    req.body.createdBy = req.user._id;
    const inspection = await Inspection.create(req.body);

    if (!newUser || !inspection) {
      return next(
        new ErrorResponse(
          `Could not process your request at this time. Please try again later`,
          404
        )
      );
    }

    Building.findOne({ address: req.body.address }).then(
      async (existingBuilding) => {
        if (existingBuilding) {
          await Building.findByIdAndUpdate(
            existingBuilding._id,
            {
              inspection: inspection._id,
            },
            {
              new: true,
              runValidators: true,
            }
          );
        } else {
          return Building.create({
            address: req.body.address,
            inspection: inspection._id,
            createdBy: req.user._id,
            user: newUser._id,
          });
        }
      }
    );

    const options = JSON.stringify({
      email: newUser.email,
      amount: inspection.price * 100,
      metadata: {
        inspection_id: inspection._id,
        reason: "Inspection Payment",
      },
    });

    // Initialize Transaction
    const initalize_transaction_url =
      "https://api.paystack.co/transaction/initialize";
    const transaction = await axios(initalize_transaction_url, {
      method: "POST",
      data: options,
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    // Change this to res.redirect
    res.status(200).json({
      success: true,
      data: transaction.data,
    });
  }
);

// @desc    Get all transactions
// @route   GET /api/v1/payments/
// @access  Private / admin
exports.getTransactions = asyncHandler(async (req, res, next) => {
  const transaction_url = `https://api.paystack.co/transaction`;
  const transactions = await axios(transaction_url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
    params: {
      page: req.query.page,
    },
  });

  res.status(200).json({
    success: true,
    data: transactions.data,
  });
});

// @desc    Verify subscription
// @route   POST /api/v1/payments/webhook
// @access  Private
exports.webhook = asyncHandler(async (req, res, next) => {
  //validate event
  res.sendStatus(200);
  var hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest("hex");
  if (hash == req.headers["x-paystack-signature"]) {
    var event = req.body;
    console.log(event);
    if (event.event === "charge.success") {
      var chargeEvent = await Event.find({
        transactionId: `${event.data.reference}`,
        type: "charge",
      });

      if (chargeEvent.length === 0) {
        // update customer if name doesn't exist
        var user = await User.findOne({ email: event.data.customer.email });
        if (!event.data.customer.first_name) {
          const nameFields = JSON.stringify({
            first_name: `${user.firstName}`,
            last_name: `${user.lastName}`,
          });
          const update_customer_url = `https://api.paystack.co/customer/${event.data.customer.customer_code}`;
          await axios(update_customer_url, {
            method: "PUT",
            data: nameFields,
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
              "Content-Type": "application/json",
            },
          });
        }

        if (event.data.metadata.reason === "Insurance Payment") {
          const insurance = await Insurance.findById(
            event.data.metadata.insurance_id
          );

          await Insurance.findByIdAndUpdate(
            insurance._id,
            { status: "success" },
            {
              new: true,
              runValidators: true,
            }
          );
        }

        if (event.data.metadata.reason === "Inspection Payment") {
          const inspection = await Inspection.findById(
            event.data.metadata.inspection_id
          );

          await Inspection.findByIdAndUpdate(
            inspection._id,
            { paid: true },
            {
              new: true,
              runValidators: true,
            }
          );
        }

        await Event.create({
          transactionId: `${event.data.reference}`,
          type: "charge",
        });
      }
    }

    if (event.event === "transfer.success") {
      var transferEvent = await Event.find({
        transactionId: `${event.data.reference}`,
        type: "transfer",
      });

      if (transferEvent.length === 0) {
        if (event.data.reason === "withdrawal") {
          const charitywit = await Insurance.findOne({
            email: event.data.recipient.email,
          });

          const charityFieldsToUpdate = {
            balance: charitywit.balance - event.data.amount,
          };

          await Insurance.findByIdAndUpdate(
            charitywit._id,
            charityFieldsToUpdate,
            {
              new: true,
              runValidators: true,
            }
          );
        }

        await Event.create({
          transactionId: `${event.data.reference}`,
          type: "transfer",
        });
      }
    }

    if (event.event === "transfer.reversed") {
      var transferEvent = await Event.find({
        transactionId: `${event.data.reference}`,
        type: "transfer",
      });

      if (transferEvent.length === 0) {
        if (event.data.reason === "withdrawal") {
          const charitywit = await Insurance.findOne({
            email: event.data.recipient.email,
          });

          const charityFieldsToUpdate = {
            balance: charitywit.balance + event.data.amount,
          };

          await Insurance.findByIdAndUpdate(
            charitywit._id,
            charityFieldsToUpdate,
            {
              new: true,
              runValidators: true,
            }
          );
        }

        await Event.create({
          transactionId: `${event.data.reference}`,
          type: "transfer",
        });
      }
    }
  }
});

// @desc    Initialise Kaduna Payment
// @route   GET /api/v1/payments/kaduna
// @access  Private / admin
exports.initialiseKaduna = asyncHandler(async (req, res, next) => {
  const payKaduna = new PayKadunaMotorMarket();

  try {
    var transactionResponse = await payKaduna.createTransaction({
      billReference: req.body.billRef,
      tpui: "TPUI123456",
    });

    if (!transactionResponse?.checkoutUrl) {
      var errMessage = "";
      if (!req.body.billRef) {
        errMessage =
          "No payment reference available, cannot generate payment url without bill reference";
      } else {
        errMessage = `cannot generate payment url for this reference ${req.body.billRef}, payment patner might be unavailable. please try again later. ${transactionResponse}`;
      }
      return next(new ErrorResponse(errMessage, 404));
    }
  } catch (error) {
    return next(new ErrorResponse(error.message, error.status));
  }

  res.status(200).json({
    success: true,
    data: transactionResponse?.checkoutUrl,
  });
});

// @desc    Get all transactions
// @route   GET /api/v1/payments/callback
// @access  Private / admin
exports.kadunaCallback = asyncHandler(async (req, res, next) => {
  try {
    const callbackData = req.body;
    console.log("Received PayKaduna callback:", callbackData);

    // Verify the transaction status and update your database
    if (callbackData.status === "success") {
      console.log("Payment successful for bill:", callbackData.billReference);
      // Update your database with the payment status
    } else {
      console.log("Payment failed for bill:", callbackData.billReference);
    }

    res.status(200).json({ status: "success", message: "Callback received" });
  } catch (error) {
    console.error("Error processing callback:", error);
    res
      .status(500)
      .json({ status: "error", message: "Callback processing failed" });
  }
});
