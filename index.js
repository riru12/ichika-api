require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const methodOverride = require('method-override');
const cloudinary = require('cloudinary').v2;

// Cloudinary and Multer config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
}); 
const upload = multer({ storage: storage });

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
app.use(methodOverride('_method'));
app.use(cors({origin: 'http://localhost:5173'}));

// Delete a manga entry entirely
app.delete('/api/manga/:id', async (req, res) => {
    try{
        const { id } = req.params;
        const manga = await MangaEntry.findByIdAndDelete(id);

        if (!manga){
            res.status(404).json({message: "Manga not found"});
        }

        let next = '';
        public_ids = []
        do {
            const data = await cloudinary.api.resources({ type: 'upload', prefix: id, max_results: 10, next_cursor: next });
            for (let i = 0; i < data.resources.length; i++) {
                public_ids.push(data.resources[i].public_id)
            }

            next = ('next_cursor' in data) ? data.next_cursor : null;
        } while (next != null);
        cloudinary.api.delete_resources(public_ids);
        cloudinary.api.delete_folder(id);

        res.status(200).json({message: "Manga deleted successfully"});
        
    } catch(error){
        res.status(500).json({message:error.message});
    }
})

// Publish a new chapter to a manga entry by ID
app.put('/api/manga/:id/new-chapter', upload.any('pages'), async (req, res) => {
    try{
        const { id } = req.params;
        const chapterNo = req.body.chapterNo;
        const manga = await MangaEntry.findById(id);
        if (!manga){
            res.status(404).json({message: "Manga not found"});
        }
        
        await MangaEntry.findByIdAndUpdate(id, 
            {$push: { chapters: { 
                    $each: [req.body], 
                    $sort: { chapterNo: 1 } 
                }}
            }, { runValidators: true });
        cloudinary.api.create_folder(`/${id}/${chapterNo}`);
        for(let i = 0; i < req.files.length; i++){
            cloudinary.uploader.upload(req.files[i].path, 
                { 
                    folder: `/${id}/${chapterNo}`,
                    use_filename: true,
                    unique_filename: false,
                })
        }

        console.log(req.files);

        const updatedManga = await MangaEntry.findById(id);
        res.status(200).json({updatedManga});
    } catch(error){
        res.status(500).json({message:error.message});
    }
})

// Update manga metadata (title, author, desc, status, genres, coverImg)
app.put('/api/manga/:id/update', async (req, res) => {
    try{
        const { id } = req.params;
        const manga = await MangaEntry.findById(id);
        if (!manga){
            res.status(404).json({message: "Manga not found"});
        }
        console.log(req.body);
        // Update the manga entry on the DB
        await MangaEntry.findByIdAndUpdate(id, req.body, { runValidators: true });
        const updatedManga = await MangaEntry.findById(id);
        res.status(200).json({updatedManga});

    } catch(error){
        res.status(500).json({message:error.message});
    }
})

// Retrieve specific manga entry by ID
app.get('/api/manga/:id', async (req, res) => {
    try{
        const { id } = req.params;
        const manga = await MangaEntry.findById(id);

        if(!manga){
            return res.status(404).json({message: "Manga not found"});
        }

        res.status(200).json({manga});
    } catch(error){
        res.status(500).json({message:error.message});
    }
})

// Retrieve all manga entries
app.get('/api/manga', async (req, res) => {
    try{
        const mangas = await MangaEntry.find({});
        res.status(200).json({mangas});
    } catch(error){
        res.status(500).json({message:error.message});
    }
})

// Create new manga entry
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