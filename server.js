const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const colors = require("colors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cors = require("cors");
const errorHandler = require("./middleware/error");
const connectDB = require("./config/db");

// load env vars
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: "./config/config.env" });
}

// connect to database
connectDB();

// route files
const auth = require("./routes/auth");
const users = require("./routes/users");
const insurance = require("./routes/insurance");
const inspection = require("./routes/inspection");
const building = require("./routes/building");
const fine = require("./routes/fine");
const fire = require("./routes/fire");
const organisation = require("./routes/organisation");
const payment = require("./routes/payment");
const collision = require("./routes/collision");
const booking = require("./routes/booking");

const app = express();

// body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie Parser
app.use(cookieParser());

// dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Sanitize input
app.use(mongoSanitize());

// set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// rate Limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 1000,
});
app.use(limiter);

// Prevent Http param pollution
app.use(hpp());

// Enable cors
app.use(
  cors({
    origin: [
      "https://sentinel-06xt.onrender.com",
      "http://localhost:5173",
      "https://www.motohub.ng",
      "https://motohub.ng"
    ], // Allow requests from this origin
  })
);

// set static folder
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/v1/auth", auth);
app.use("/api/v1/users", users);
app.use("/api/v1/insurance", insurance);
app.use("/api/v1/inspection", inspection);
app.use("/api/v1/building", building);
app.use("/api/v1/fine", fine);
app.use("/api/v1/fire", fire);
app.use("/api/v1/org", organisation);
app.use("/api/v1/payment", payment);
app.use("/api/v1/collision", collision);
app.use("/api/v1/booking", booking);
app.use(errorHandler);

if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.header("x-forwarded-proto") !== "https") {
      res.redirect(`https://${req.header("host")}${req.url}`);
    } else {
      next();
    }
  });
}

const PORT = process.env.PORT;

const server = app.listen(
  PORT,
  process.env.IP,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);

// Handle unhandled rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // close server & exit process
  server.close(() => process.exit(1));
});
