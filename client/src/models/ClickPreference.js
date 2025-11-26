import mongoose from "mongoose";

const clickPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Simple per-category click counters, keyed by the exact Event.category
    // value (e.g. "Music", "Sports", etc.).
    categoryClicks: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.models.ClickPreference ||
  mongoose.model("ClickPreference", clickPreferenceSchema);


