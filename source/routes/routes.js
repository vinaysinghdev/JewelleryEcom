// npm modules

const express = require("express");
const route = express.Router();
const multer = require("multer");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const nodemailer = require("nodemailer");
const axios = require("axios");
const bcrypt = require("bcrypt");
require("dotenv").config();
const sharp = require("sharp");
const Razorpay = require("razorpay");
const fs = require("fs");
const path = require("path");
const easyinvoice = require("easyinvoice");
const moment = require("moment");
const gengerateId = require("order-id")("sineJewel");

// razorpay setup

var razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_ID,
  key_secret: process.env.RAZORPAY_SECERT,
});

// custom modules

const productDb = require("../models/productDb");
const userDb = require("../models/userDb");
const orderDb = require("../models/ordersDb");
const isLogin = require("../middleware/isLogin");
const isLogout = require("../middleware/isLogout");

// session setup
route.use(cookieParser());
const oneDay = 1000 * 60 * 60 * 24;
route.use(
  session({
    secret: process.env.SECRET_KEY,
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: true,
  })
);

// setup nodemailer
let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  secure: true,
  port: 465,
  auth: {
    user: "vinay.shilpani123@gmail.com",
    pass: process.env.MAILPASS,
  },
});

// setup multer
const productStorage = multer.diskStorage({
  //destination for files
  destination: function (request, file, callback) {
    callback(null, "public/images/productImg");
  },
  //add back the extension
  filename: function (request, file, callback) {
    callback(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const profileStorage = multer.diskStorage({
  //destination for files
  destination: function (request, file, callback) {
    callback(null, "public/images/unCroppedImg");
  },
  //add back the extension
  filename: function (request, file, callback) {
    callback(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

//upload parameters for multer
const uploadProduct = multer({
  storage: productStorage,
  limits: {
    fieldSize: 1024 * 1024 * 3,
  },
});

const uploadProfile = multer({
  storage: profileStorage,
  limits: {
    fieldSize: 1024 * 1024 * 3,
  },
});

route.get("/login", (req, res) => {
  try {
    res.render("login");
  } catch (err) {
    console.log(err);
  }
});

route.post("/userLogin", async (req, res) => {
  try {
    let { useremail, password } = req.body;
    let checkUser = await userDb.findOne({ email: useremail });
    if (checkUser) {
      let checkPass = await bcrypt.compare(password, checkUser.password);
      if (checkPass) {
        req.session.userid = checkUser._id.toHexString();
        req.session.wishlist = checkUser.userWhishlists;
        req.session.navProImg = checkUser.profileImg;

        // localStorage.setItem(userLocId,checkUser._id.toHexString());

        res.send("login");
      } else {
        res.send("invalidPass");
      }
    } else {
      res.send("invalidUser");
    }
  } catch (err) {
    console.log(err);
  }
});

route.post("/logout", (req, res) => {
  try {
    req.session.destroy();
    res.send("userlogout");
  } catch (err) {
    console.log(err);
  }
});

route.get("/", async (req, res) => {
  try {
    let homeProduct = await productDb.find({ showOnHome: "1" });
    console.log(req.session);
    res.render("home", {
      homeProduct: homeProduct,
      checkLogin: req.session.userid,
      wishlist: req.session.wishlist,
      navProImg: req.session.navProImg,
    });
  } catch (err) {
    console.log(err);
  }
});

route.get("/about", (req, res) => {
  try {
    res.render("about", {
      checkLogin: req.session.userid,
      wishlist: req.session.wishlist,
      navProImg: req.session.navProImg,
    });
  } catch (err) {
    console.log(err);
  }
});

route.get("/contact", (req, res) => {
  try {
    res.render("contact", {
      checkLogin: req.session.userid,
      wishlist: req.session.wishlist,
      navProImg: req.session.navProImg,
    });
  } catch (err) {
    console.log(err);
  }
});

route.get("/addProduct", (req, res) => {
  try {
    res.render("addProduct");
  } catch (err) {
    console.log(err);
  }
});

route.post(
  "/addnewItem",
  uploadProduct.array("productImg"),
  async (req, res) => {
    try {
      let { name, category, desc, price, oldPrice, stock, showOnHome } =
        req.body;

      let colorString = req.body.colors;
      let colors = colorString.split(",");

      let sizeString = req.body.size;
      let size = sizeString.split(",");

      let reviews = [
        {
          userid: "User 1",
          ratingStar: "5",
          ratingDesc: "Such a nice smartphone",
          Date: "27 Mar 2022",
        },
        {
          userid: "User 2",
          ratingStar: "2",
          ratingDesc: "Build Quality is cheap",
          Date: "20 Mar 2022",
        },
        {
          userid: "User 3",
          ratingStar: "4",
          ratingDesc: "Camera is the best of the phone",
          Date: "17 Mar 2022",
        },
      ];

      let img1 = req.files[0].filename;
      let img2 = req.files[1].filename;
      let img3 = req.files[2].filename;

      let productImg = [img1, img2, img3];

      await productDb.insertMany({
        name,
        category,
        desc,
        price,
        oldPrice,
        stock,
        showOnHome,
        colors,
        size,
        reviews,
        productImg,
      });
      res.redirect("/addProduct");
    } catch (err) {
      console.log(err);
    }
  }
);

route.get("/shop", async (req, res) => {
  try {
    let searchSr = req.query.search;
    let sortSr = req.query.sort || "";
    let categorySr = req.query.category || "";
    let colorsSr = req.query.colors || "";

    console.log(searchSr, sortSr, categorySr, colorsSr);

    let allProduct;
    if (searchSr) {
      allProduct = await productDb.find({
        $text: { $search: searchSr },
        // name: { $regex: ".*" + searchSr + ".*" },
      });
    } else {
      allProduct = await productDb.find();
    }

    let category = await productDb.distinct("category");
    let colors = await productDb.distinct("colors");
    console.log(colors);
    res.render("shopByCategory", {
      allProduct: allProduct,
      category: category,
      colors: colors,
      checkLogin: req.session.userid,
      navProImg: req.session.navProImg,
    });
  } catch (err) {
    console.log(err);
  }
});

route.get("/shop/:category", async (req, res) => {
  try {
    let category = req.params.category;
    console.log(category);
    let check = await productDb.findOne({ category });
    if (check) {
      let pageData = await productDb.find({ category });
      res.render("shopsPage", {
        category: category,
        pageData: pageData,
        checkLogin: req.session.userid,
        wishlist: req.session.wishlist,
        navProImg: req.session.navProImg,
      });
    } else {
      res.redirect("/");
    }
  } catch (err) {
    console.log(err);
  }
});

route.get("/shop/:category/:id", async (req, res) => {
  try {
    let category = req.params.category;
    let _id = req.params.id;
    let singleProduct = await productDb.findOne({ _id });
    if (singleProduct) {
      let realtedProduct = await productDb.find({ category }).limit(4);
      res.render("singleProduct", {
        productData: singleProduct,
        category: category,
        realtedProduct: realtedProduct,
        checkLogin: req.session.userid,
        wishlist: req.session.wishlist,
        navProImg: req.session.navProImg,
      });
    } else {
      res.redirect("/");
    }
  } catch (err) {
    console.log(err);
  }
});

route.post("/addCartBtn", async (req, res) => {
  try {
    if (req.session.userid) {
      let productId = req.body.id;
      await userDb.updateMany(
        { _id: req.session.userid },
        { $push: { userCart: productId } }
      );
      res.send("added");
    } else {
      res.send("notLogin");
    }
  } catch (err) {
    console.log(err);
  }
});

route.post("/addWishlist", async (req, res) => {
  try {
    if (req.session.userid) {
      let productId = req.body.id;

      let check = await userDb.findOne(
        {},
        {
          _id: req.session.userid,
          userWhishlists: { $elemMatch: { $eq: productId } },
        }
      );

      if (check.userWhishlists.length === 0) {
        await userDb.updateMany(
          { _id: req.session.userid },
          { $push: { userWhishlists: productId } }
        );

        // update session
        let updateWishlist = await userDb.findOne({ _id: req.session.userid });
        req.session.wishlist = updateWishlist.userWhishlists;

        res.send("added");
      } else {
        await userDb.updateMany(
          { _id: req.session.userid },
          { $pull: { userWhishlists: productId } }
        );

        // update session
        let updateWishlist = await userDb.findOne({ _id: req.session.userid });
        req.session.wishlist = updateWishlist.userWhishlists;

        res.send("removed");
      }
    } else {
      res.send("notLogin");
    }
  } catch (err) {
    console.log(err);
  }
});

route.get("/signup", async (req, res) => {
  try {
    if (req.session.userid) {
      res.redirect("/");
    } else {
      res.render("signup");
    }
  } catch (err) {
    console.log(err);
  }
});

// check mail is valid or invalid

let otpGenerate;
route.post("/checkMail", async (req, res) => {
  try {
    let { name, email } = req.body;
    let checkUser = await userDb.findOne({ email });
    let options = {
      method: "GET",
      url: "https://validect-email-verification-v1.p.rapidapi.com/v1/verify",
      params: { email: email },
      headers: {
        "X-RapidAPI-Key": "09721b021bmsh047a8f6be585914p120b1cjsnf43def86d7c8",
        "X-RapidAPI-Host": "validect-email-verification-v1.p.rapidapi.com",
      },
    };
    axios
      .request(options)
      .then(function (response) {
        if (response.data.status == "valid") {
          if (checkUser) {
            res.send("existing");
          } else {
            res.send("valid");
            otpGenerate = Math.floor(100000 + Math.random() * 900000);
            console.log(name, email, otpGenerate);
            let content = `Hi ${name}, <b>${otpGenerate}</b>  is your verification code for signing up on sinejewel`;
            const mailOptions = {
              from: "vinay.shilpani123@gmail.com",
              to: email,
              subject: "Regarding account on sinejewel",
              html: content,
            };
            transporter.sendMail(mailOptions, function (err, info) {
              if (err) {
                console.log(err);
              }
            });
          }
        } else {
          res.send("invalid");
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  } catch (err) {
    console.log(err);
  }
});

route.post("/verifyOtp", async (req, res) => {
  try {
    let opt = req.body.otp;
    if (opt == otpGenerate) {
      otpGenerate = "";
      res.send("match");
    } else {
      res.send("mismatch");
    }
  } catch (err) {
    console.log(err);
  }
});

route.post("/finalSignUp", async (req, res) => {
  try {
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.pass;
    let profileImg = "";

    let options = {
      method: "GET",
      url: `https://v2.namsor.com/NamSorAPIv2/api2/json/genderFull/${name}`,
      headers: {
        "X-API-KEY": "295cb2e9ac6c67d4aca138918f911d13",
        Accept: "application/json",
      },
    };
    await axios
      .request(options)
      .then(function (response) {
        let gender = response.data.likelyGender;
        if (gender == "male") {
          profileImg = "maleProfile.jpg";
        } else if (gender == "female") {
          profileImg = "femaleProfile.jpg";
        } else {
          profileImg = "profile.jpg";
        }
      })
      .catch(function (error) {
        console.error(error);
      });

    bcrypt.hash(password, 10, async (err, hash) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Password is" + hash);
        await userDb.insertMany({ name, email, password: hash, profileImg });
        res.send("registered");
      }
    });
  } catch (err) {
    console.log(err);
  }
});

route.get("/wishlist", async (req, res) => {
  try {
    if (req.session.userid) {
      let user = await userDb.findOne({ _id: req.session.userid });
      let wishlistProduct = await productDb.find({
        _id: { $in: user.userWhishlists },
      });
      res.render("wishlistpage", {
        checkLogin: req.session.userid,
        wishlistProduct: wishlistProduct,
        navProImg: req.session.navProImg,
      });
    } else {
      res.redirect("/");
    }
  } catch (err) {
    console.log(err);
  }
});

route.get("/cart", async (req, res) => {
  try {
    if (req.session.userid) {
      let user = await userDb.findOne({ _id: req.session.userid });
      let cartProduct = await productDb.find({ _id: { $in: user.userCart } });
      res.render("cartpage", {
        checkLogin: req.session.userid,
        cartProduct: cartProduct,
        navProImg: req.session.navProImg,
      });
    } else {
      res.redirect("/");
    }
  } catch (err) {
    console.log(err);
  }
});

route.post("/movetoCart", async (req, res) => {
  try {
    if (req.session.userid) {
      let productId = req.body.id;
      await userDb.updateMany(
        { _id: req.session.userid },
        { $push: { userCart: productId }, $pull: { userWhishlists: productId } }
      );

      // update session
      let updateWishlist = await userDb.findOne({ _id: req.session.userid });
      req.session.wishlist = updateWishlist.userWhishlists;

      res.send("added");
    } else {
      res.send("notLogin");
    }
  } catch (err) {
    console.log(err);
  }
});

route.post("/deletetoCart", async (req, res) => {
  try {
    if (req.session.userid) {
      let productId = req.body.id;
      await userDb.updateMany(
        { _id: req.session.userid },
        { $pull: { userCart: productId } }
      );

      // update session
      let updateWishlist = await userDb.findOne({ _id: req.session.userid });
      req.session.wishlist = updateWishlist.userWhishlists;

      res.send("removed");
    } else {
      res.send("notLogin");
    }
  } catch (err) {
    console.log(err);
  }
});

route.post("/removeWishlist", async (req, res) => {
  try {
    if (req.session.userid) {
      let productId = req.body.id;
      await userDb.updateMany(
        { _id: req.session.userid },
        { $pull: { userWhishlists: productId } }
      );

      // update session
      let updateWishlist = await userDb.findOne({ _id: req.session.userid });
      req.session.wishlist = updateWishlist.userWhishlists;

      res.send("removed");
    } else {
      res.send("notLogin");
    }
  } catch (err) {
    console.log(err);
  }
});

route.get("/profile", async (req, res) => {
  try {
    if (req.session.userid) {
      console.log('if');
      let userInfo = await userDb.findOne({ _id: req.session.userid });
      res.render("profile", {
        checkLogin: req.session.userid,
        userInfo: userInfo,
        navProImg: req.session.navProImg,
      });
    } else {
      res.redirect("/");
    }
  } catch (err) {
    console.log(err);
  }
});

route.post(
  "/uploadProImg",
  uploadProfile.single("proImg"),
  async (req, res) => {
    try {
      let cropFileName = `${req.file.fieldname}${Date.now()}.jpeg`;

      sharp(req.file.path)
        .resize(200, 200)
        .jpeg({ quality: 90 })
        .toFile(`./public/images/profileImg/${cropFileName}`, async (err) => {
          if (err) {
            console.log(err);
          } else {
            fs.unlinkSync(req.file.path);
            await userDb.updateOne(
              { _id: req.session.userid },
              { profileImg: cropFileName }
            );
            // update session
            req.session.navProImg = cropFileName;
            res.redirect("/profile");
          }
        });
    } catch (err) {
      console.log(err);
    }
  }
);

route.get("/orders", async (req, res) => {
  try {
    if (req.session.userid) {
      let user = await userDb.findOne({ _id: req.session.userid });

      let userOrdersData = await orderDb
        .find({
          _id: { $in: user.userOrders },
        })
        .sort({ _id: -1 });

      res.render("orders", {
        checkLogin: req.session.userid,
        navProImg: req.session.navProImg,
        userOrdersData: userOrdersData,
      });
    } else {
      res.redirect("/");
    }
  } catch (err) {
    console.log(err);
  }
});

let checkoutData = [];
let deliveryAmtType = "";
let finalOrderData = [];

route.post("/checkCheckout", async (req, res) => {
  try {
    checkoutData = req.body.cartProductData;
    deliveryAmtType = req.body.deliveryType;
    if (checkoutData.length > 0) {
      res.json("gotocheckout");
    } else {
      res.json("emptycheckout");
    }
  } catch (err) {
    console.log(err);
  }
});

route.get("/checkout", async (req, res) => {
  try {
    if (req.session.userid) {
      if (checkoutData.length > 0) {
        finalOrderData = checkoutData;
        let total = 0;
        let deliveryAmt = 0;
        for (i = 0; i < checkoutData.length; i++) {
          total += checkoutData[i][2] * checkoutData[i][3];
        }
        if (deliveryAmtType == "quick") {
          deliveryAmt = 80;
        }
        checkoutData = [];
        let userData = await userDb.findOne({ _id: req.session.userid });
        res.render("checkOut", {
          checkLogin: req.session.userid,
          navProImg: req.session.navProImg,
          address: userData.address,
          total: total,
          deliveryAmt: deliveryAmt,
        });
      } else {
        res.redirect("/");
      }
    } else {
      res.redirect("/");
    }
  } catch (err) {
    console.log(err);
  }
});

route.post("/saveOrder", async (req, res) => {
  try {
    let user = await userDb.findOne({ _id: req.session.userid });
    let orderBy = req.session.userid;
    let orderByName = user.name;

    let orderDetails = [];
    for (k = 0; k < finalOrderData.length; k++) {
      let proId = finalOrderData[k][0];

      let ProData = await productDb.findOne({ _id: proId });
      let proImg = ProData.productImg[0];
      let proCat = ProData.category;
      let name = finalOrderData[k][1];
      let price = finalOrderData[k][2];
      let quantity = finalOrderData[k][3];
      let taxrate = 5;

      orderDetails.push({
        productId: proId,
        productImg: proImg,
        productCat: proCat,
        quantity: quantity,
        description: name,
        price: price,
        "tax-rate": taxrate,
      });
    }

    let orderAddress = req.body.address;
    let orderMobile = req.body.mobile;
    let orderStatus = "Order Placed";
    let orderDliveryType = deliveryAmtType;
    let orderAmount = req.body.totalAmt;
    let orderInvoice = "invoice" + moment().format("hmmssDDMMYYYY");
    let paymentBy = req.body.payemntMode;
    let transactionId = "SineJewelTxn-" + gengerateId.generate();
    let orderDate = moment().format("MMMM Do YYYY, h:mm:ss a");

    let saveOrder = await orderDb.insertMany({
      orderBy,
      orderByName,
      orderDetails,
      orderAddress,
      orderMobile,
      orderStatus,
      orderDliveryType,
      orderAmount,
      orderInvoice,
      paymentBy,
      transactionId,
      orderDate,
    });

    await userDb.updateMany(
      { _id: req.session.userid },
      { $push: { userOrders: saveOrder[0]._id.toHexString() } }
    );

    await userDb.updateMany({ _id: req.session.userid }, { userCart: [] });

    res.json("orderPlaced");
  } catch (err) {
    console.log(err);
  }
});

route.post("/genegratePdf", async (req, res) => {
  try {
    let orderData = await orderDb.findOne({ _id: req.body.id });

    let pdfData = {
      // Let's add a recipient
      client: {
        company: orderData.orderByName,
        address: orderData.orderAddress[0],
        zip: orderData.orderAddress[2],
        city: orderData.orderAddress[1],
        country: "India",
        custom1: orderData.orderMobile,
        custom2: `Payment By ${orderData.paymentBy}`,
      },

      // Now let's add our own sender details
      sender: {
        company: "SineJewel",
        address: "XYZ Flat, Central Secretariat",
        zip: "110001",
        city: "New Delhi",
        country: "India",
      },
      images: {
        logo: "https://i.ibb.co/v4Yw0hM/5xwbhf-D1na-20210312142051-removebg-preview.png",
        background:
          "https://i.pinimg.com/564x/24/88/29/2488291cfa80d2ead2c27fcf171c76ab.jpg",
      },
      information: {
        number: orderData.orderInvoice.substring(
          7,
          orderData.orderInvoice.length
        ),
        date: moment().format("Do MMM YYYY"),
      },
      products: orderData.orderDetails,

      "bottom-notice":
        "Thank you for your order! You can track your order or shop again here. ❤️",

      settings: {
        currency: "INR",
        locale: "en-US",
        "tax-notation": "gst",
        "margin-top": 25,
        "margin-right": 25,
        "margin-left": 25,
        "margin-bottom": 25,
        format: "A4",
        height: "842px",
        width: "595px",
        orientation: "landscape",
      },
    };

    easyinvoice.createInvoice(pdfData, function (result) {
      fs.writeFileSync(`invoice${req.body.id}.pdf`, result.pdf, "base64");
      res.send("Downloaded");
    });
  } catch (err) {
    console.log(err);
  }
});

route.post("/cancellorder", async (req, res) => {
  try {
    let _id = req.body.id;
    await orderDb.updateMany({ _id }, { orderStatus: "Order Cancelled" });
    res.send("cancel");
  } catch (err) {
    console.log(err);
  }
});

route.post("/updateprofile", async (req, res) => {
  let name = req.body.name;
  let mobile = req.body.mobile;
  let address1 = req.body.address1;
  let address2 = req.body.state;
  let address3 = req.body.pincode;

  let address = [address1, address2, address3];
  await userDb.updateMany(
    { _id: req.session.userid },
    { name, mobile, address }
  );
  res.redirect("/profile");
});


route.get('/admin',(req,res)=>{
  res.render('adminhome')
})

module.exports = route;
