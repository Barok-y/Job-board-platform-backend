import mongoose from "mongoose";

const refreshTokenSchema = mongoose.Schema({
    user_id:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },

    refresh_token:{
        type: String,
        required: true
    },

    createdAt:{
        type: Date,
        default: Date.now
    },

    expiresAt:{
        type: Date,
        required: true
    }
});

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
export default RefreshToken;