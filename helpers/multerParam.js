module.exports = ({ input, name }) => {
  let filePath;
  let filename;
  let contentType;
  let storage = [];

  switch (Array.isArray(input)) {
    case true:
      input.forEach((element) => {
        filePath = element.path;
        filename = name;
        contentType = element.mimetype;
        storage.push({ filePath, filename, contentType });
      });
      break;

    case false:
      if (typeof input === "object" && Object.keys(input).length) {
        filePath = input.path;
        filename = name;
        contentType = input.mimetype;
        storage = { filePath, filename, contentType };
      }
      break;

    default:
      break;
  }

  return storage;
};
