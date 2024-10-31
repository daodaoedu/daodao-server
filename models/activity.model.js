const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  userId: {
    type: String,
  },
  title: {
    type: String,
  },
  photoURL: {
    type: String,
  },
  photoAlt: {
    type: String,
  },  
  category: {
    type: Array,
  },
  activityCategory: {
    type: Array,
  },
  area: {
    type: Array,
  },
  time: {
    type: String,
  },
  participator: {
    type: String,
  },
  partnerStyle: {
    type: String,
  },
  partnerEducationStep: {
    type: Array,
  },
  motivation: {
    type: String,
  },
  content: {
    type: String,
  },
  description: {
    type: String,
  },
  outcome: {
    type: String,
  },
  notice: {
    type: String,
  },
  tagList: {
    type: Array,
  },
  isGrouping: {
    type: Boolean,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
  updatedDate: {
    type: Date,
    default: Date.now,
  },
  deadline: {
    type: Date,
  },
  isNeedDeadline: {
    type: Boolean,  
  },
  views:{
    type: Number,
    default: 0,
  }
});

module.exports = mongoose.model("Activity", activitySchema);
