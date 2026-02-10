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
  },
  tokenId: {
    type: Number,
    unique: true,
    sparse: true // Allows nulls for failed mints
  },
  mintStatus: {
    type: String,
    enum: ["pending", "minted", "failed"],
    default: "pending"
  },
  txHash: { type: String }, // The blockchain transaction hash
  metadataUri: { type: String }, // Link to IPFS or API JSON
  custodial: {
    type: Boolean,
    default: true
  },
  ownerWallet: {
    type: String, // Platform wallet when custodial, user wallet when claimed
  },
  isRedeemed: {
    type: Boolean,
    default: false
  },
  qrData: {
    type: Object // Stores signed QR data and expiration
  },
  isForResale: {
    type: Boolean,
    default: false
  },
  resalePrice: {
    type: Number,
    min: 0
  }
}, { timestamps: true });

export default mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);
