const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20");
const TempUser = require("../models/tempUser.model");
const { User, Contact } = require('../models');

const AUTH_OPTIONS = {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
}

passport.serializeUser((user, done) => {
    console.log("SerializeUser")
    console.log("SerializeUser:",user)
    done(null, user.external_id);
});

passport.deserializeUser(async (_id, done) => {
    console.log("DeserializeUser")
    let foundUser = await User.findOne({ _id });
    console.log("DeserializeUser:",foundUser)
    done(null, foundUser)
})

passport.use(new GoogleStrategy(
    AUTH_OPTIONS,
    async (accessToken, refreshToken, profile, done) => {
        try {
            console.log('passport_profile', profile);
            
            // 首先檢查是否存在正式用戶
            const foundContact = await Contact.findOne({
                where: { google_id: profile.id },
                include: [{
                    model: User,
                    required: false
                }]
            });
            console.log("foundContact", foundContact);
            console.log("foundContact.User", foundContact.User);
            if (foundContact && foundContact.User) {
                console.log("使用者已註冊");
                return done(null, foundContact.User);
            }

            // 如果沒有正式用戶，則檢查或創建臨時用戶
            let tempUser = await TempUser.findOne({ googleID: profile.id }).exec();
            
            if (!tempUser) {
                console.log("新用戶，創建臨時資料");
                tempUser = new TempUser({
                    googleID: profile.id,
                    email: profile.emails[0].value,
                    name: profile.displayName,
                    photoURL: profile.photos[0].value,
                });
                
                try {
                    tempUser = await tempUser.save();
                } catch (saveError) {
                    if (saveError.code === 11000) {
                        // 如果是重複鍵錯誤，重新獲取該臨時用戶
                        console.log("臨時用戶已存在，正在獲取");
                        tempUser = await TempUser.findOne({ googleID: profile.id }).exec();
                    } else {
                        throw saveError;
                    }
                }
            } else {
                console.log("找到現有的臨時用戶");
            }

            return done(null, tempUser);
        } catch (error) {
            console.error("Google 策略錯誤:", error);
            return done(error, null);
        }
    })
);