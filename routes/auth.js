const express = require("express");
const router = express.Router();
const passport = require("passport");
const { generateToken } = require("../services/jwt");
const User = require("../models/user.model");



router.get("/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        prompt: "select_account",
    })
);

router.get("/google/callback", passport.authenticate("google"), async (req, res) => {
    console.log("google/callback_req.session", req.user);
    const { googleID,_id, name } = req.user;

    let isUserExit = await User.findOne({ googleID }).exec();
    // let isNewUser = createdDate == updatedDate;
    console.log("google/callback_isUserExit", isUserExit);
    const time = Date.now();
    const isTemp = !isUserExit;

    const payload = { _id, name, time, isTemp: isTemp };
    const token = generateToken(payload);
    console.log("google/callback_token", token);
    const url = isUserExit
        ? `${process.env.FRONTEND_URL}?id=${req.user._id}&token=${token}`
        : `${process.env.FRONTEND_URL}/signin?id=${req.user._id}&token=${token}`;
    console.log("google/callback_url", url);

    return res.redirect(url);
});


module.exports = router;

