const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
    uri: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    artist: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "user",
       required: true
    },
    genre: {
        type: String,
        default: 'Electronic'
    },
    coverImage: {
        type: String,
        default: ''
    },
    duration: {
        type: String,
        default: '03:15'
    },
    plays: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const musicModel = mongoose.model("music", musicSchema);

module.exports = musicModel;