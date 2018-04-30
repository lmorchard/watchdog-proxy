const util = require("util");

exports.promisifyMethods = (object, methods) =>
  methods.reduce(
    (out, name) => ({
      ...out,
      [name]: util.promisify(object[name].bind(object))
    }),
    { object }
  );
