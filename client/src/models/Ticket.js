import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const ticketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    default: () => uuidv4(),
    unique: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true
  },
  userId: {   
    type: String,
    required: true
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ["valid", "used", "canceled"],
    default: "valid"
  }
}, { timestamps: true });

export default mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);
