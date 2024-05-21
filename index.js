require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
    secure:true,
});

const MangaEntry = require('./models/manga.model.js');

const app = express();
app.use(express.json())

app.put('/api/manga/:id', async (req, res) => {
    try{
        const { id } = req.params;

        // find the manga
        var manga = await MangaEntry.findById(id);

        if (!manga){
            return res.status(404).json({message: "Manga not found. Double-check the ID."});
        }

        // add the new chapters to the already uploaded chapters, then sort
        let newChapters = req.body.chapters;
        for(let i = 0; i < newChapters.length; i++){
            cloudinary.api.create_folder(`/${id}/${newChapters[i]}`)
        }


        // testing upload of images
        for(let i = 0; i < 7; i++){
            cloudinary.uploader.upload(`./chapter-images/${i+1}.jpg`, 
                { 
                    folder: `/${id}/1`,
                    use_filename: true,
                    unique_filename: false,
                })
        }

        let allChapters = newChapters.concat(manga.chapters);
        req.body.chapters = allChapters.sort(function(a, b){return a - b});

        // update the manga entry on the DB
        var manga = await MangaEntry.findByIdAndUpdate(id, req.body, { runValidators: true });

        // return the updated entry
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

app.post('/api/manga/new', async (req, res) => {
    try {
        const mangaEntry = await MangaEntry.create(req.body);
        cloudinary.api.create_folder(`/${mangaEntry._id.toString()}`)
        .then((result)=>{
            if (result.success==true){
                res.status(200).json({mangaEntry});
            } else{
                res.status(500).json({message:"WARNING: Cloudinary folder creation unsuccessful"});
            }
        })
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