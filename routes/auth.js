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
    let { googleID,_id,id,external_id,roleId, name } = req.user;
    console.log("google/callback_req.user", req.user);
    
    let isUserExit = false;

    if(external_id){
        _id = external_id;
        isUserExit = true;
    }
    console.log("google/callback_isUserExit", isUserExit);
    const time = Date.now();
    const isTemp = !isUserExit;

    const payload = { id,_id, name,roleId, time, isTemp: isTemp };
    console.log("google/callback_payload", payload);
    const token = generateToken(payload);
    console.log("google/callback_token", token);
    const url = `${process.env.FRONTEND_URL}/auth/callback?token=${token}`
    console.log("google/callback_url", url);

    return res.redirect(url);
});


module.exports = router;

