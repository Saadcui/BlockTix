import mongoose from "mongoose";

const userPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  preferences: {
    sports: { type: Number, default: 0 },
    music: { type: Number, default: 0 },
    movies: { type: Number, default: 0 },
    theater: { type: Number, default: 0 },
    general: { type: Number, default: 0 },
  },
}, { timestamps: true });

export default mongoose.models.UserPreference ||
  mongoose.model("UserPreference", userPreferenceSchema);
