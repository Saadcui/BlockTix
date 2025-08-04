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
        enum: ['user', 'organizer'],
        default: 'user', 
    }
}, {
    timestamps: true
})
export default mongoose.models.User || mongoose.model('User', UserSchema);