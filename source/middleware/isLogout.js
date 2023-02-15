const isLogout = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      res.redirect("/admin");
    }
    // else{
    //     res.redirect('/admin')
    // }
    next();
  } catch (err) {
    console.log(err);
  }
};

module.exports = isLogout;