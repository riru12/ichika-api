const mongoose = require('mongoose');

const ChapterSchema = mongoose.Schema(
    {
        chapterNo: {
            type: Number,
            required: [true, "Chapter number required"],
        },
        language: {
            type: String,
            required: [true, "Language required"],
        },
        title: {
            type: String,
            required: false
        }
    },
    {
        // _id: false,
        timestamps: true
    }
);

const ChapterEntry = mongoose.model("Chapter", ChapterSchema);
module.exports = {
    ChapterEntry,
    ChapterSchema
};