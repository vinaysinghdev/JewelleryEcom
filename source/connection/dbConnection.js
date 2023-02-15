// const mongoose = require("mongoose");
// let dbURl = process.env.MONGOURL;

// mongoose.set('strictQuery', true);
// mongoose
//   .connect(dbURl, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => {
//     console.log("Database Connected Successfully");
//   })
//   .catch((err) => {
//     console.log(err);
//   });



const mongoose = require("mongoose");
mongoose.set('strictQuery', true);
const dbConnect = () => {
  const connectionParams = { useNewUrlParser: true };
  mongoose.connect(process.env.MONGOURL, connectionParams);

  mongoose.connection.on("connected", () => {
    console.log("Connected to database sucessfully");
  });

  mongoose.connection.on("error", (err) => {
    console.log("Error while connecting to database :" + err);
  });

  mongoose.connection.on("disconnected", () => {
    console.log("Mongodb connection disconnected");
  });
};

module.exports = dbConnect;