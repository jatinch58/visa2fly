const { Schema, model } = require("mongoose");
const userSchema = new Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  acknowledgement: {
    type: Boolean,
    required: true,
  },
});
module.exports = model("user", userSchema);
