const express = require("express");
const router = express.Router();
const passport = require("passport");
const { generateToken } = require("../services/jwt");
const { User, Contact } = require('../models');

router.get("/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        prompt: "select_account",
    })
);

router.get("/google/callback", passport.authenticate("google"), async (req, res) => {
    console.log("google/callback_req.session", req.user);
    let { googleID,_id,id,external_id, name } = req.user;

    const isUserExit = await User.findOne({
        where: { external_id }
    });
    // let isNewUser = createdDate == updatedDate;
    console.log("google/callback_isUserExit", isUserExit);
    const time = Date.now();
    const isTemp = !isUserExit;


    if(external_id){
        _id = external_id;
    }

    const payload = { id,_id, name, time, isTemp: isTemp };
    console.log("google/callback_payload", payload);
    const token = generateToken(payload);
    console.log("google/callback_token", token);
    const url = `${process.env.FRONTEND_URL}/auth/callback?token=${token}`
    console.log("google/callback_url", url);

    return res.redirect(url);
});


module.exports = router;

