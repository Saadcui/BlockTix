import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    firebase_uid: { 
        type: String,
        required: true,
        unique: true 
    },
    email : {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    role:{
        type: String,
        enum: ['user', 'organizer', 'admin'],
        default: 'user', 
    },
    walletAddress: {
        type: String,
        default: null,
        trim: true,
    },
    // Off-chain ledger: royalties accrued to this organizer (unpaid).
    // Since payment gateway isn't implemented yet, we track balances in DB.
    royaltyBalance: {
        type: Number,
        default: 0,
        min: 0,
    }
    ,
    // Organizer-configured royalty rate (basis points). Industry norms often cap at ~10%.
    defaultRoyaltyBps: {
        type: Number,
        default: 500,
        min: 0,
        max: 1000,
    }
}, {
    timestamps: true
})
export default mongoose.models.User || mongoose.model('User', UserSchema);