require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Cloudinary and Multer config
const upload = multer({ dest: 'uploads/' })
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
    secure:true,
});

// Models
const MangaEntry = require('./models/manga.model.js');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.put('/api/manga/:id', async (req, res) => {
    try{
        const { id } = req.params;

        // Find the Manga we are updating
        var manga = await MangaEntry.findById(id);

        if (!manga){
            return res.status(404).json({message: "Manga not found. Double-check the ID."});
        }

        // If a new chapter is being uploaded into the manga's chapter list
        if (req.body.newChapter){
            let newChapter = req.body.newChapter;
            delete req.body.newChapter;

            cloudinary.api.create_folder(`/${id}/${newChapter}`);
            req.body.chapters = manga.chapters.concat(newChapter).sort(function(a, b){return a - b});

            // Upload the newChapter images
            for(let i = 0; i < 7; i++){
                cloudinary.uploader.upload(`./chapter-images/${i+1}.jpg`, 
                    { 
                        folder: `/${id}/${newChapter}`,
                        use_filename: true,
                        unique_filename: false,
                    })
            }
        }

        // Update the manga entry on the DB
        var manga = await MangaEntry.findByIdAndUpdate(id, req.body, { runValidators: true });

        // Return the updated manga entry
        const updatedManga = await MangaEntry.findById(id);
        res.status(200).json({updatedManga});

    } catch(error){
        res.status(500).json({message:error.message});
    }
})

app.get('/api/manga/:id', async (req, res) => {
    try{
        const { id } = req.params;
        const manga = await MangaEntry.findById(id);

        if(!manga){
            return res.status(404).json({message: "Manga not found. Double-check the ID."});
        }

        res.status(200).json({manga});
    } catch(error){
        res.status(500).json({message:error.message});
    }
})

app.get('/api/manga', async (req, res) => {
    try{
        const mangas = await MangaEntry.find({});
        res.status(200).json({mangas});
    } catch(error){
        res.status(500).json({message:error.message});
    }
})

app.post('/api/manga/new', upload.single('cover'), async (req, res) => {
    try {
        // Add cover filename to manga entry's fields
        req.body.coverImg = req.file.filename;
        const mangaEntry = await MangaEntry.create(req.body);
        
        const folderName = `/${mangaEntry._id.toString()}`;
        const createFolderResult = await cloudinary.api.create_folder(folderName);
        if (createFolderResult) {
            cloudinary.uploader.upload(req.file.path, { 
                folder: folderName,
                use_filename: true,
                unique_filename: false,
            })
            res.status(200).json({mangaEntry});
        } else {
            res.status(500).json({message:"WARNING: Cloudinary folder creation unsuccessful"});
        }

    } catch(error){
        res.status(500).json({message:error.message});
    }
});

mongoose.connect(`mongodb+srv://riru12:${process.env.MONGODB_PASS}@ichika.svkd2y2.mongodb.net/ichika?retryWrites=true&w=majority&appName=ichika`)
    .then(()=>{
        // Ensure connection to MongoDB before opening the server
        console.log("Connected to MongoDB Database");
        app.listen(3000, ()=>{
            console.log("Server is now running on PORT 3000");
        })
    })
    .catch(()=>{
        console.log("Connection to MongoDB Failed");
    })