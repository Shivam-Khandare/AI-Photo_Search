import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
        },
        deviceImagePath: {
            type: String,
            required: true,
            unique: true,
        },
        embedding: {
            type: [Number],
            required: true,
        },
    },
    {timestamps: true}
)

const Image = mongoose.model('Image', imageSchema)

export default Image;