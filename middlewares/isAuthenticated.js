const  { verifyToken } = require("../services/jwt");

const isAuthenticated = (req, res, next) => {
  const token = req.headers.authorization || '';
  if(!token){
    return res.status(401).json({message: "No token provided"});
  }

  try {
    const cleanedToken = token.replace('Bearer', '').trim();
    const decoded = verifyToken(cleanedToken);
    console.log("Decoded token:", decoded); 
    if (decoded.error) {
      return res.status(401).json({ message: decoded.error });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({message:'Token is invalid'});
  }
}

const requireCompleteProfile = (req, res, next) => {
  console.log("req.user:", req.user); 
  if (req.user.isTemp) {
      return res.status(403).json({ error: "Please complete your profile registration" });
  }
  next();
};


module.exports = {
  isAuthenticated,
  requireCompleteProfile
}