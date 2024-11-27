const mongoose = require("mongoose");
const subMilestoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dates: [{ type: Date, required: true }],
  description: { type: String, required: true },
});

const milestoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  subMilestones: [subMilestoneSchema],
});
const pricingOptionSchema = new mongoose.Schema({
  option: { type: String, required: true, immutable: true },
  price: { type: Number, required: true, immutable: true },
  email: [{ type: String }],
});
const marathonSchema = new mongoose.Schema({
  title: { type: String },
  event_id: { type: String},
  user_id: { type: String},
  description: { type: String},
  motivation: {
    tags: [{ type: String }],
    description: { type: String },
  },
  content: { type: String},
  goals: { type: String },
  strategies: {
    tags: [{ type: String }],
    description: { type: String },
  },
  resources: { type: String},
  milestones: [milestoneSchema],
  outcomes: {
    tags: [{ type: String }],
    description: { type: String },
  },
  status:{ type: String },
  registration_status:{ type: String },
  registration_date: {type: String},
  pricing: { type: [pricingOptionSchema] },
  isPublic: { type: Boolean, default: false },
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
