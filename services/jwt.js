const jwt = require('jsonwebtoken');
const secrect = process.env.JWT_SECURITY;
const expiresIn = process.env.JWT_EXPIRATION

const generateToken = (payload) => {
  try {
    return jwt.sign(payload, secrect, { expiresIn });
  } catch (error) {
    console.error('Token generation failed:', error.message);
    throw new Error('Token generation failed');
  }
};

const verifyToken = (token) => {
  try {
    console.log('verifyToken_token', token);
    
    const decoded = jwt.verify(token, secrect);
    console.log('verifyToken', decoded);
  
    return decoded;
  }catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.error('Token verification failed: Token has expired');
      return { error: "Token has expired" };
    } else {
      console.error('Token verification failed:', error.message);
      return { error: "Token is invalid" };
    }
  }
}



module.exports = {
  generateToken,
  verifyToken
}