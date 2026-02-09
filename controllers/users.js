const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const crypto = require("crypto");
const User = require("../models/User");
const { getDateBounds } = require("../utils/dateHandler");
const moment = require("moment-timezone");
const { sendSms } = require("../utils/message");
const axios = require("axios");
const Organisation = require("../models/Organisation");
const { uploadToS3 } = require("../utils/fileUploadService");

// @desc    Get All Users
// @route   GET /api/v1/user
// @access  Private / admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get a single User
// @route   GET /api/v1/user/:id
// @access  Private / admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate(req.query.populate);
  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Get a single User
// @route   GET /api/v1/user/:id/stats
// @access  Private / admin
exports.getUserStats = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate(
    "insurance fine inspection"
  );
  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }
  const insurance = user.insurance ? user.insurance.length : 0;
  const fine = user.fine ? user.fine.length : 0;
  const inspection = user.inspection ? user.inspection.length : 0;

  const dateBounds = getDateBounds();

  let val = 0;

  var items = []
    .concat(user.insurance || [])
    .concat(user.fine || [])
    .concat(user.inspection || []);

  items.forEach((ins) => {
    val += ins.price;
  });

  items = items.filter(
    (it) =>
      it.createdAt > dateBounds.startOfYear.toDate() &&
      it.createdAt < dateBounds.endOfMonth.toDate()
  );

  const date = new Date();
  const monthNo = date.getMonth() + 1;
  var data = [];

  for (let i = 0; i < monthNo; i++) {
    const monthDonation = items.filter((ins) => {
      const date = moment(ins.createdAt).tz("Africa/Lagos");
      if (date.month() === i) {
        return true;
      } else {
        return false;
      }
    });

    const sum = monthDonation.reduce((accumulator, currentValue) => {
      const amount = currentValue.price;
      const total = accumulator + amount;
      const acuu = Math.round(total * 100) / 100;
      return acuu;
    }, 0);
    data.push({
      name: dateBounds.months[i],
      price: monthDonation ? sum : 0,
    });
  }

  var rise = 0;

  if (data.length > 1) {
    const curr = data[data.length - 1].price;
    const lass = data[data.length - 2].price;
    rise = lass === 0 ? 0 : Math.floor(((curr - lass) / lass) * 100);
  }

  res.status(200).json({
    success: true,
    data: { graph: data, val, rise, insurance, fine, inspection },
  });
});

// @desc    Create user
// @route   POST /api/v1/user
// @access  Public
exports.createUser = asyncHandler(async (req, res, next) => {
  var user = await User.create(req.body);

  if (user.organisation) {
    const org = await Organisation.find({ name: user.organisation });
    if (org.length > 0) {
      var zns = org.zones;
      if (user.zone && !zns?.includes(user.zone)) {
        zns.push(user.zone);
      }
    } else {
      const orgg = await Organisation.create({
        name: user.organisation,
        zone: user?.zone,
      });
    }
  }

  if (req.files.avatar) {
    const file = req.files.avatar[0];
    // make sure that the image is a photo
    if (!file.mimetype.startsWith("image")) {
      return next(new ErrorResponse(`Please upload an image file`, 400));
    }

    if (file.size > process.env.MAX_FILE_UPLOAD) {
      return next(
        new ErrorResponse(
          `Please Upload an image file less than ${process.env.MAX_FILE_UPLOAD / 1000000
          }mb`,
          400
        )
      );
    }
    const timestamp = Date.now();

    const avatar = await uploadToS3({
      file: req.files.avatar,
      folderName: "avatar",
      name: `${timestamp}_${user.id}`,
    });

    if (!avatar) {
      return next(new ErrorResponse(`error ${avatar}`));
    }

    user = await User.findByIdAndUpdate(
      user.id,
      { picture: avatar[0] },
      {
        new: true,
        runValidators: true,
      }
    );
  }

  res.status(201).json({
    success: true,
    data: user,
  });
});

// @desc    Update user details
// @route   PUT /api/v1/user/:id
// @access  Private
exports.updateUser = asyncHandler(async (req, res, next) => {
  if (req.params.id === req.user._id && req.user.role !== "user") {
    return next(
      new ErrorResponse(`You are not authorized to make that change`, 404)
    );
  }

  if (req.body.newPassword) {
    var userPass = await User.findById(req.params.id).select(`+password`);

    if (!(await userPass.matchPassword(req.body.password))) {
      return next(new ErrorResponse("Password is incorrect", 400));
    }

    userPass.password = req.body.newPassword;

    await userPass.save();

    delete req.body.password;
    delete req.body.newPassword;
  }

  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Send Invite
// @route   POST /api/v1/users/invite
// @access  Private/Admin
exports.sendInvite = asyncHandler(async (req, res, next) => {
  // Validate email
  if (!req.body.email) {
    return next(
      new ErrorResponse("Please provide an email you want to invite", 400)
    );
  }

  let regex = new RegExp("[a-z0-9]+@[a-z]+.[a-z]{2,3}");

  if (!regex.test(req.body.email)) {
    return next(
      new ErrorResponse("Please provide a valid email to invite", 400)
    );
  }

  const user = await User.findOne({
    email: req.body.email.toLowerCase(),
  }).select("id");

  if (user) {
    return next(
      new ErrorResponse(`The account ${req.body.email} already exists`, 404)
    );
  }

  const inviter = await User.findById(req.user.id).select(
    "id organisation role firstName"
  );

  if (inviter.role === "admin" && !req.body.organisation) {
    req.body.organisation = inviter.organisation;
  }

  // get reset token
  const resetToken = inviter.getInviteToken(req.body);

  await inviter.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/invite/${resetToken}`;

  const emailResetUrl = `https://sentinel.buildsure.ng/invite/${resetToken}`;

  // send reset email
  // const send_email_url = "https://api.brevo.com/v3/smtp/email";

  const message = `You are receiving this message because ${inviter.firstName} has invited you to create an account on sentinel. Please go to: \n\n ${emailResetUrl}`;

  const opt = { phoneNo: req.body.phoneNo, message };

  sendSms(opt);
  // const options = JSON.stringify({
  //   sender: {
  //     name: "sentinel Admin",
  //     email: "mlawal@buildsure.ng",
  //   },
  //   to: [
  //     {
  //       email: `${req.body.email}`,
  //       name: `${req.body.firstName} ${req.body.lastName}`,
  //     },
  //   ],
  //   subject: "Invite to join sentinel",
  //   htmlContent: `<html><head></head><body><p>Hello,</p>${message}</p></body></html>`,
  // });

  // const email = await axios(send_email_url, {
  //   method: "POST",
  //   data: options,
  //   headers: {
  //     "api-key": `${process.env.BREVO_API_KEY}`,
  //     "Content-Type": "application/json",
  //   },
  // });

  res.status(200).json({
    success: true,
    data: resetUrl,
  });
});

// @desc    View Invite
// @route   GET /api/v1/users/invite/:resettoken
// @access  Public
exports.viewInvite = asyncHandler(async (req, res, next) => {
  // Get hashed passwords
  const inviteToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");

  const user = await User.findOne({
    inviteToken,
  }).select("inviteToken inviteExpire firstName lastName invite");

  if (!user) {
    return next(new ErrorResponse("Invalid Token", 400));
  }

  var invite = user.invite;

  res.status(200).json({
    success: true,
    data: { user, invite },
  });
});

// @desc    Accept Invite
// @route   POST /api/v1/users/invite/:resettoken
// @access  Public
exports.acceptInvite = asyncHandler(async (req, res, next) => {
  // Get hashed passwords
  const inviteToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");

  const user = await User.findOne({
    inviteToken,
  }).select("inviteToken inviteExpire firstName lastName invite");

  if (!user) {
    return next(new ErrorResponse("Invalid Token", 400));
  }

  var invite = user.invite;
  // Give admin priviledges
  user.inviteToken = undefined;
  user.inviteExpire = undefined;
  user.invite = undefined;
  await user.save();

  const userInvited = await User.findOne({
    email: invite.email.toLowerCase(),
  }).select("id");

  if (userInvited) {
    console.log("here");
    console.log(userInvited);
    await User.findByIdAndUpdate(userInvited.id, invite, {
      new: true,
      runValidators: true,
    });
  } else {
    console.log(userInvited);
    console.log("here3");
    // invite.password = "123456";
    console.log(invite);
    const newUser = await User.create({
      email: invite.email,
      role: invite.role,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      organisation: invite?.organisation,
      zone: invite?.zone,
      unit: invite?.unit,
      password: req.body.password,
    });

    if (newUser.organisation) {
      const org = await Organisation.find({ name: newUser.organisation });
      if (org.length > 0) {
        var zns = org.zones ? org.zones : [];
        if (newUser.zone && !zns?.includes(newUser.zone)) {
          zns.push(newUser.zone);
        }
      } else {
        const orgg = await Organisation.create({
          name: newUser.organisation,
          zone: newUser?.zone,
        });
      }
    }
  }

  res.status(200).json({
    success: true,
    data: { user, invite },
  });
});

// @desc    Get all Inspection stats
// @route   GET /api/v1/Inspection/stat/pie
// @access  Private / admin
exports.getAllStats = asyncHandler(async (req, res, next) => {
  const users = await User.find();
  var active = 0;
  var total = 0;
  var zones = 0;

  if (users) {
    total = users.length;
    const date = new Date();

    users.forEach((us) => {
      if (us.lastActive && date - us.lastActive < 1800000) {
        active++;
      }
    });
  }

  const orgs = await Organisation.find();

  if (orgs) {
    orgs.forEach((or) => {
      zones += or.zones.length;
    });
  }

  res.status(200).json({
    success: true,
    data: { zones, active, total },
  });
});
