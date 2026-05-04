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
  },
  earlyBird: {
    enabled: { type: Boolean, default: false },
    discountPrice: { type: Number, min: 0 },
    endDate: { type: Date },
    maxTickets: { type: Number, min: 1 },
    soldCount: { type: Number, default: 0 }
  },
  resaleCapEnabled: {
    type: Boolean,
    default: false,
  },
  resaleCapPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 1000,
  },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    deleted: {
      type: Boolean,
      default: false,
      index: true
    },
    deletedAt: {
      type: Date,
      default: null
    }
      ,
      approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true,
      },
      submittedAt: {
        type: Date,
        default: Date.now,
        index: true,
      },
      approvedAt: {
        type: Date,
        default: null,
      },
      approvedBy: {
        type: String,
        default: null,
        trim: true,
      },
      rejectedAt: {
        type: Date,
        default: null,
      },
      rejectedBy: {
        type: String,
        default: null,
        trim: true,
      },
      rejectionReason: {
        type: String,
        default: null,
        trim: true,
      }
}, { timestamps: true });

// Note: Hard deletion prevention is handled in the DELETE API route
// This ensures tickets are preserved even if event is soft-deleted

export default mongoose.models.Event || mongoose.model("Event", eventSchema);
