global.console.log = () => {};

// 設置模組別名解析
const path = require('path');
const moduleNameMapper = {
  '^@/(.*)$': path.resolve(__dirname, 'src/$1')
};

// 讓 Node.js 能夠解析 @ 別名
const Module = require('module');
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function(request, parent, isMain, options) {
  // 檢查請求的模組名稱是否符合任何別名
  const pattern = '^@/(.*)$';
  const regex = new RegExp(pattern);
  if (regex.test(request)) {
    // 替換模組名稱中的別名
    const newRequest = request.replace(regex, path.resolve(__dirname, 'src/$1'));
    return originalResolveFilename.call(this, newRequest, parent, isMain, options);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};