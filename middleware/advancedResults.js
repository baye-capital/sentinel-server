const { isValidObjectId } = require("mongoose");

const AdvancedResults = (model, populate) => async (req, res, next) => {
  let query;

  var search = {};
  // check for boolean values
  for (let key in req.query) {
    if (key.startsWith("_bool")) {
      const val = req.query[key];
      const newKey = key.substring(5);
      req.query[newKey] = val === "true";
      delete req.query[key];
    } else if (key.startsWith("_plus")) {
      const val = req.query[key];
      const newKey = key.substring(5);
      req.query[newKey] = val.trim() + "+";
      delete req.query[key];
    } else if (key.startsWith("_search")) {
      const regex = new RegExp(req.query[key], "i");
      const newKey = key.substring(7);
      search[newKey] = { $regex: regex };
      delete req.query[key];
    } else if (key === "afterDate") {
      const afterDate = new Date(req.query.afterDate);
      if (!isNaN(afterDate.getTime())) {
        search.expiry = { $lte: afterDate };
      }
      delete req.query.afterDate;
    } else if (key === "afterDateIns") {
      const afterDate = new Date(req.query.afterDateIns);
      if (!isNaN(afterDate.getTime())) {
        search.date = { $gte: afterDate };
      }
      delete req.query.afterDateIns;
    } else if (key === "rangeStart") {
      const rangeStart = new Date(req.query.rangeStart);
      if (!isNaN(rangeStart.getTime())) {
        search.createdAt = { $gte: rangeStart, ...search.createdAt };
      }
      delete req.query.rangeStart;
    } else if (key === "rangeEnd") {
      const rangeEnd = new Date(req.query.rangeEnd);
      if (!isNaN(rangeEnd.getTime())) {
        search.createdAt = { $lte: rangeEnd, ...search.createdAt };
      }
      delete req.query.rangeEnd;
    }
  }

  // copy req.query
  const reqQuery = { ...req.query };

  // fields to exclude
  const removeFields = ["select", "sort", "page", "limit", "populate"];

  // loop over removeFields and delete them from remove query
  removeFields.forEach((param) => delete reqQuery[param]);

  // create req string
  let queryStr = JSON.stringify(reqQuery);

  // create operators ($lt,$gte)
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  // finding resource
  const parsedStr = { ...JSON.parse(queryStr), ...search };
  query = model.find(parsedStr);

  // select fields
  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }

  // sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join("");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  // pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments(parsedStr);

  query = query.skip(startIndex).limit(limit);

  if (req.query.populate) {
    query = query.populate(req.query.populate);
  }

  if (populate) {
    query = query.populate(populate);
  }

  // executing query
  const results = await query;

  // pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.advancedResults = {
    success: true,
    total,
    count: results.length,
    pagination,
    limit,
    data: results,
  };

  next();
};

module.exports = AdvancedResults;
