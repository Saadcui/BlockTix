import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";


const eventSchema = new mongoose.Schema({
   eventId: {
    type: String,
    default: () => uuidv4(), 
    unique: true
  },
  event: { 
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  time: { 
    type: String, 
    required: true
  },
  location: {
    type: String,
    required: true
  },
  category: { 
    type: String,
    enum: ["Art", "Sports", "Food And Drink", "Education", "Festival", "Music", "Other"],
    required: true
  },
  price: { 
    type: Number,
    required: true,
    min: 0
  },
  totalTickets: { 
    type: Number,
    required: true,
    min: 1
  },
  remainingTickets: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    default: ""
  },
  createdAt: { 
    type: Date,
    default: Date.now
  },
  organizerId: { 
    type: String,
    ref: "Organizer",
    required: true
  }
}, { timestamps: true });


export default mongoose.models.Event || mongoose.model("Event", eventSchema);
