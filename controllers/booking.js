const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Booking = require("../models/Booking");
const Inspection = require("../models/Inspection");
const { getDateBounds } = require("../utils/dateHandler");
const PayKadunaMotorMarket = require("../utils/payment");
const payKaduna = new PayKadunaMotorMarket();

// @desc    Get All Bookings
// @route   GET /api/v1/Booking
// @access  Private / admin
exports.getBookings = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get a single Booking
// @route   GET /api/v1/Booking/:id
// @access  Private / admin
exports.getBooking = asyncHandler(async (req, res, next) => {
  // Apply zone filter from middleware
  let query = { _id: req.params.id };
  if (req.zoneFilter && Object.keys(req.zoneFilter).length > 0) {
    query = { ...query, ...req.zoneFilter };
  }

  const booking = await Booking.findOne(query).populate(req.query.populate);
  if (!booking) {
    return next(
      new ErrorResponse(`Booking not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: booking,
  });
});

// @desc    Create Booking
// @route   POST /api/v1/Booking
// @access  Public
exports.createBooking = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user._id;

  // Auto-populate zone for non-admins (done by middleware)
  // Zone is already set by autoPopulateZone middleware

  const billResponse = await payKaduna.createBill({
    amount: req.body.price,
    mdasId: await payKaduna.getMdasId(req.body.offence[0].mdasId),
    narration: req.body.offence[0].name,
    firstName: req.body.name,
    middleName: ".",
    lastName: ".",
    phone: req.body.phoneNo,
    address: req.body.address,
  });
  console.log("Bill created:", billResponse);
  if (!billResponse?.billReference) {
    return next(
      new ErrorResponse(
        `Bill not created. Payment generation failed for mdasId ${req.body.offence[0].mdasId}`,
        404
      )
    );
  }
  req.body.billRef = billResponse.billReference;

  const booking = await Booking.create(req.body);

  res.status(201).json({
    success: true,
    data: booking,
  });
});

// @desc    Update Booking details
// @route   PUT /api/v1/Booking/:id
// @access  Private
exports.updateBooking = asyncHandler(async (req, res, next) => {
  // Apply zone filter from middleware
  let query = { _id: req.params.id };
  if (req.zoneFilter && Object.keys(req.zoneFilter).length > 0) {
    query = { ...query, ...req.zoneFilter };
  }

  var booking = await Booking.findOne(query);

  if (!booking) {
    return next(
      new ErrorResponse(`Booking not found with id of ${req.params.id}`, 404)
    );
  }

  // Prevent zone tampering for non-admins
  if (req.user.role !== "state admin" && req.body.zone) {
    delete req.body.zone;
  }

  booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: booking,
  });
});

// @desc    Delete Booking
// @route   DELETE /api/v1/Booking/:id
// @access  Private/Admin
exports.deleteBooking = asyncHandler(async (req, res, next) => {
  // Apply zone filter from middleware
  let query = { _id: req.params.id };
  if (req.zoneFilter && Object.keys(req.zoneFilter).length > 0) {
    query = { ...query, ...req.zoneFilter };
  }

  const booking = await Booking.findOne(query);
  if (!booking) {
    return next(
      new ErrorResponse(`Booking not found with id of ${req.params.id}`, 404)
    );
  }

  await Booking.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Booking Stats
// @route   DELETE /api/v1/Booking/stats
// @access  Private/Admin
exports.bookingStat = asyncHandler(async (req, res, next) => {
  const dateBounds = getDateBounds();
  let today = 0;
  let week = 0;
  let month = 0;
  let year = 0;

  // Apply zone filter from middleware
  let query = { createdAt: { $gte: dateBounds.startOfYear } };
  if (req.zoneFilter && Object.keys(req.zoneFilter).length > 0) {
    query = { ...query, ...req.zoneFilter };
  }

  // Retrieve all bookings from this year onwards
  const books = await Booking.find(query).select("id createdAt");

  books.forEach((booking) => {
    const createdAt = booking.createdAt;
   
    if (createdAt >= dateBounds.startOfDay) {
      today++;
      week++;
      month++;
      year++;
    } else if (createdAt >= dateBounds.startOfWeek) {
      week++;
      month++;  
      year++;
    } else if (createdAt >= dateBounds.startOfMonth) {
      month++;
      year++;
    } else if (createdAt >= dateBounds.startOfYear) {
      year++;
    }
  });

  res.status(200).json({
    success: true,
    data: {
      today,
      week,
      month,
      year,
    },
  });
});

// @desc    Booking Stats Revenue
// @route   DELETE /api/v1/Booking/revenue
// @access  Private/Admin
exports.bookingRev = asyncHandler(async (req, res, next) => {
  const dateBounds = getDateBounds();
  let today = 0;
  let week = 0;
  let month = 0;
  let year = 0;

  // Apply zone filter from middleware
  let query = { createdAt: { $gte: dateBounds.startOfYear }, paid: true };
  if (req.zoneFilter && Object.keys(req.zoneFilter).length > 0) {
    query = { ...query, ...req.zoneFilter };
  }

  // Retrieve all bookings from this year onwards
  const books = await Booking.find(query).select("id createdAt price");

  books.forEach((booking) => {
    const createdAt = booking.createdAt;
    const price = booking.price;

    if (createdAt >= dateBounds.startOfDay) {
      today += price;
      week += price;
      month += price;
      year += price;
    } else if (createdAt >= dateBounds.startOfWeek) {
      week += price;
      month += price;
      year += price;
    } else if (createdAt >= dateBounds.startOfMonth) {
      month += price;
      year += price;
    } else if (createdAt >= dateBounds.startOfYear) {
      year += price;
    }
  });

  res.status(200).json({
    success: true,
    data: {
      today,
      week,
      month,
      year,
    },
  });
});

// @desc    Update Booking details
// @route   GET /api/v1/Booking/check
// @access  Private
exports.checkPayment = asyncHandler(async (req, res, next) => {
  try {
    const bookings = await Booking.find({ paid: false }).select("billRef");

    let updateCount = 0;

    if (bookings && bookings.length > 0) {
      const billPromises = bookings.map(async (bk) => {
        try {
          const getBill = await payKaduna.getBill(bk.billRef);
          console.log(getBill);

          if (getBill.payStatus === "Paid") {
            await Booking.findByIdAndUpdate(
              bk._id,
              {
                paid: true,
              },
              {
                new: true,
                runValidators: true,
              }
            );
          }

          updateCount++;
        } catch (err) {
          console.error(`Error processing billRef ${bk.billRef}:`, err.message);
        }
      });

      await Promise.all(billPromises);
    }

    res.status(200).json({
      success: true,
      updated: updateCount,
    });
  } catch (err) {
    console.error("Top-level error:", err.message);
    res.status(500).json({
      success: false,
      error: "An error occurred while checking bills.",
    });
  }
});

// @desc    Update Booking details
// @route   GET /api/v1/Booking/check/:id
// @access  Private
exports.checkSinglePayment = asyncHandler(async (req, res, next) => {
  var booking = await Booking.findById(req.params.id).select("billRef");

  if (!booking) {
    return next(
      new ErrorResponse(`Booking not found with id of ${req.params.id}`, 404)
    );
  }

  const getBill = await payKaduna.getBill(booking.billRef);

  let update = "unpaid";

  if (getBill.payStatus === "Paid") {
    await Booking.findByIdAndUpdate(
      booking._id,
      {
        paid: true,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    update = booking._id;
  }

  res.status(200).json({
    success: true,
    data: update,
  });
});
