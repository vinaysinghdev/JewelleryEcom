const mongoose = require("mongoose");

const product = mongoose.Schema(
  {
    name: {
      type: String,
    },
    category: {
      type: String,
    },
    desc: {
      type: String,
    },
    price: {
      type: String,
    },
    oldPrice: {
      type: String,
    },
    stock: {
      type: String,
    },
    showOnHome: {
      type: String,
    },
    colors: {
      type: Array,
    },
    size: {
      type: Array,
    },
    reviews: {
      type: Array,
    },
    productImg: {
      type: Array,
    },
  },
  { versionKey: false }
);

module.exports = mongoose.model("productDb", product);
