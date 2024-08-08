const express = require("express");
const router = express.Router();
const passport = require("passport");
const { generateToken } = require("../services/jwt");


router.get("/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        prompt: "select_account",
    })
);

router.get("/google/callback", passport.authenticate("google"), async (req, res) => {
    console.log("google/callback_req.session", req.user);
    const { _id, name, createdDate, updatedDate } = req.user;
    console.log("google/callback_createdDate", typeof(createdDate));
    console.log("google/callback_updatedDate", typeof(updatedDate));


    let formattedCreatedDate = createdDate.toISOString();
    let formattedUpdatedDate = updatedDate.toISOString();

    let isNewUser = formattedCreatedDate === formattedUpdatedDate;
    // let isNewUser = createdDate == updatedDate;
    console.log("google/callback_isNewUser", isNewUser);
    const time = Date.now();
    const payload = { _id, name, time };
    const token = generateToken(payload);
    console.log("google/callback_token", token);
    const url = isNewUser
        ? `${process.env.FRONTEND_URL}/signin?id=${req.user._id}&token=${token}`
        : `${process.env.FRONTEND_URL}?id=${req.user._id}&token=${token}`;
    console.log("google/callback_url", url);

    return res.redirect(url);

    //TODO: different case redirect
    // res.send({
    //     status: true,
    //     data: {
    //       id: req.user.id,
    //       name: req.user.displayName,
    //       token
    //     }
    //   });
});


module.exports = router;

