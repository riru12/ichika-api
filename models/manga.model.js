const mongoose = require('mongoose');
const { ChapterSchema } = require('./chapter_model.js');

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
        chapters: {
            type: [ ChapterSchema ],
            required: true,
            default: [],
        },
        status: {
            type: String, 
            enum:['Completed', 'Ongoing'],
            required: true,
        },
        genres: {
            type: [ String ],
            required: true,
            default: [],
        },
        coverImg: {
            type: String
        }
    },
    {
        timestamps: true,
    }
);

const MangaEntry = mongoose.model("Manga", MangaSchema);
module.exports = MangaEntry;