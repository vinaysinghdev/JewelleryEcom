const mongoose = require("mongoose");

const order = mongoose.Schema(
  {
    orderBy: {
      type: String,
    },
    orderByName: {
      type: String,
    },
    orderDetails: {
      type: Array,
    },
    orderAddress: {
      type: Array,
    },
    orderMobile: {
      type: String,
    },
    orderStatus: {
      type: String,
    },
    orderDliveryType: {
      type: String,
    },
    orderAmount: {
      type: String,
    },
    orderInvoice: {
      type: String,
    },
    paymentBy: {
      type: String,
    },
    transactionId: {
      type: String,
    },
    orderDate: {
      type: String,
    },
    
  },
  { versionKey: false }
);

module.exports = mongoose.model("orderDb", order);
