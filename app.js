const express = require("express");
const app = express();
const helmet = require("helmet");
const cors = require("cors");
require("dotenv").config();
const PORT = process.env.PORT;
const path = require("path");
const mainRoute = require("./source/routes/routes");
let database = require("./source/connection/dbConnection");

//use cors
// app.use(cors());

// database
database();

// set app engine and te,plating

app.set("view engine", "ejs");
app.set("views", "views");
app.set("trust proxy", true);

// set express body parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// set files path
const staticPath = path.join(__dirname, "./public");
app.use(express.static(staticPath));
app.use("/shop", express.static(staticPath));
app.use("/shop/:category/:_id", express.static(staticPath));

// set security headers
// app.use(helmet());

app.use(mainRoute);

app.use((req, res, next) => {
  res.status(404).render("page404")
})

app.use((req, res, next) => {
  res.status(500).render("page500")
})


app.listen(PORT, () => {
  console.log(`Server is runnig on ${PORT}  ❤️`);
});
