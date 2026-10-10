import mongoose from "mongoose";

//* ENsures input is a whole Number
const wholeNumber = {
  validator: Number.isInteger,
  message: "{PATH} must be a whole number",
};

//* Schema definition
const contributionSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SavingsGroup",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "{PATH} is required"],
    },
    cycleNumber: {
      type: Number,
      required: [true, "{PATH} is required"],
      min: 1,
      validate: wholeNumber,
    },
    amount: {
      type: Number,
      required: [true, "{PATH} is required"],
      min: 1,
      validate: wholeNumber,
    },
    paidOn: { type: Date, default: Date.now },
    note: {
      type: String,
      trim: true,
      maxlength: [200, "{PATH} must be at least 6 characters"],
    },
  },
  { timestamps: true },
);

//* R14: one contribution per member per cycle per group.
contributionSchema.index(
  { group: 1, user: 1, cycleNumber: 1 },
  { unique: true },
);

export default mongoose.model("Contribution", contributionSchema);
