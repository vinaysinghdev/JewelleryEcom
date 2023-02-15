const mongoose = require("mongoose");

const user = mongoose.Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    password: {
      type: String,
    },
    address: {
      type: Array,
    },
    mobile: {
      type: String,
    },
    profileImg: {
      type: String,
    },
    userCart: {
      type: Array,
    },
    userWhishlists: {
      type: Array,
    },
    userOrders: {
      type: Array,
    },
    userRatings: {
      type: Array,
    },
  },
  { versionKey: false }
);

module.exports = mongoose.model("userDb", user);
