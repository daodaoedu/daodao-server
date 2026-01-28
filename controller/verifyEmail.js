const User = require("../models/user.model");
const  { verifyToken,generateToken } = require("../services/jwt");
const sendWelcomeEmail = require("./sendWelcomeEmail");
const { FRONTEND_URL } = process.env;


const verifyEmail = async (req,res) => {
    const decodedQuery = decodeURIComponent(req.url);
    console.log("Decoded query:", decodedQuery);
    const tokenMatch = decodedQuery.match(/token=([^&]*)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    console.log("token", token);
    // 檢查 token 是否存在
    if(!token){
        return res.status(401).json({message: "No token provided"});
      }

    // 檢查token 並更新 user 資料
    try {
        const cleanedToken = token.replace('Bearer', '').trim();
        
        let decoded = verifyToken(cleanedToken);
        console.log("decoded",decoded);

        if (decoded.error) {
            return res.status(401).json({ message: decoded.error });
          }

        console.log("decoded",decoded);
      
        _id = decoded;

        let user = await User.findOne({ _id });
        console.log("user",user);

        if (user) {
          user.isVerified = true;
          console.log("user_isVerified",user);

          const url = `${process.env.FRONTEND_URL}/auth/callback?token=${token}&isVerified=true`
            
          await sendWelcomeEmail(user.email, user.name);


          return res.redirect(url);
        }

        return res.status(404).json({ message: "User not found" });
      } catch (err) {
        res.status(400).json({ message: "Token is invalid" });
      }

}

module.exports = verifyEmail;
