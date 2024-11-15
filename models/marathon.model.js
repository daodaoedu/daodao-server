const mongoose = require("mongoose");
const subMilestoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  description: { type: String, required: true },
});

const milestoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  description: { type: String, required: true },
  subMilestones: [subMilestoneSchema],
});
const marathonSchema = new mongoose.Schema({
  title: { type: String },
  description: { type: String},
  motivation: { type: String },
  content: { type: String},
  goals: { type: String },
  strategies: { type: String },
  resources: { type: String},
  milestones: [milestoneSchema],
  outcomes: { type: String },
  princing: { type: Array },
  createdDate: {
    type: Date,
    default: Date.now,
  },
  updatedDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Marathon", marathonSchema);
