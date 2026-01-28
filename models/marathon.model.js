const mongoose = require("mongoose");
const subMilestoneSchema = new mongoose.Schema({
  name: { type: String },
  dates: [{ type: Date }],
  description: { type: String },
});

const milestoneSchema = new mongoose.Schema({
  name: { type: String},
  startDate: { type: Date},
  endDate: { type: Date},
  subMilestones: [subMilestoneSchema],
});
const pricingOptionSchema = new mongoose.Schema({
  option: { type: String, required: true, immutable: true },
  price: { type: Number },
  email: [{ type: String }],
});
const marathonSchema = new mongoose.Schema({
  title: { type: String },
  eventId: { type: String},
  userId: { type: String},
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
  resources: {
    title: { type: String },
    link: { type: String },
  },
  milestones: [milestoneSchema],
  outcomes: {
    tags: [{ type: String }],
    description: { type: String },
  },
  status:{ type: String },
  registrationStatus:{ type: String },
  registrationDate: {type: String},
  pricing: { type: pricingOptionSchema },
  isPublic: { type: Boolean, default: false },
  isSendEmail: { type: Boolean, default: false },
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
