const mongoose = require('mongoose');

const MangaSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Manga title required"],
        },
        author: {
            type: String,
            required: [true, "Manga author required (if unknown, input N/A)"],
        },
        desc: {
            type: String,
            required: [true, "Manga description required"],
        },
        uploadedChs: {
            type: Number,
            required: true,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const MangaEntry = mongoose.model("Manga", MangaSchema);
module.exports = MangaEntry;