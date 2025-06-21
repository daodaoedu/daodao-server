const jwt = require('jsonwebtoken');

exports.verifyRequest = (req) => {
  // 優先從 Authorization header 取得
  let token = req.headers.authorization?.split(' ')[1];
  
  // 次之從 cookie 取得
  if (!token && req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return { error: 'MISSING_AUTH' };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECURITY, { algorithms: ['HS256'] }); // 明確指定算法
    return { user: decoded };
  } catch (error) {
    // 在測試環境中不輸出錯誤信息，避免污染測試輸出
    if (process.env.NODE_ENV !== 'test') {
      console.error('JWT Error:', error.message);
    }
    return { error: 'INVALID_TOKEN' };
  }
}; 