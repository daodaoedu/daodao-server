const mongoose = require("mongoose");

const tempUserSchema = new mongoose.Schema({
  googleID: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  photoURL: {
    type: String
  },
  createdDate: {
    type: Date,
    default: Date.now,
    expires: '1h' // 文檔將在 1 小時後自動過期
  },
  updatedDate: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

const TempUser = mongoose.model('TempUser', tempUserSchema);

module.exports = TempUser;
