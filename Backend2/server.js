let express = require("express");//backend object
let cors = require("cors");
let {MongoClient,ObjectId} = require("mongodb");
let multer = require("multer");//storage rrecep bananakeliye
let path = require("path");
let fs = require("fs");
let cloudinary = require("cloudinary").v2;
let {CloudinaryStorage}= require("multer-storage-cloudinary");
require("dotenv").config();

let app = express();
app.use(cors());
app.use(express.json());
//app.use('/uploads', express.static('uploads'));

const url = process.env.MONGODB_URL || 'mongodb://0.0.0.0:27017';
const port = process.env.PORT || 3000;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});
let storage = new CloudinaryStorage({cloudinary})
let recep = multer({storage});

app.post("/upload", recep.single("file"), 
(req, res) => {
  try {
    console.log("Upload request received");
    console.log("File:", req.file ? req.file.filename : "NO FILE");
    console.log("Body:", req.body);
    
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    if (!req.body.username || !req.body.caption) {
      return res.status(400).json({ error: "Username and caption are required" });
    }

    let client = new MongoClient(url);
    client.connect()
    let db = client.db("tinder");
    let collec = db.collection("photos");
    let obj= {
        username: req.body.username,
        caption: req.body.caption,
        file_url: req.file.path,
        file_name: req.file.filename,
        upload_time: new Date()
    }
    console.log("Saving to DB:", obj);
    collec.insertOne(obj)
    .then((result) => {
      client.close();
      console.log("Upload successful");
      res.json({success: true, data: result})
    })
    .catch((error) => {
      client.close();
      console.error("Database error:", error.message);
      res.status(500).json({error: error.message})
    })
  } catch(error) {
    console.error("Upload error:", error.message);
    res.status(500).json({error: error.message});
  }
});
app.get("/files",
    (req,res)=>{
        try {
            let client= new MongoClient(url);
            client.connect();
            let db = client.db("tinder");
            let collec = db.collection("photos");
            let username = req.query.username;
            let obj= username? {username}:{}
            collec.find(obj).toArray()
            .then((result)=>{
                client.close();
                res.json(result)
            })
            .catch((error)=>{
                client.close();
                console.error("Database error:", error);
                res.status(500).json({error: error.message});
            });
        } catch(error) {
            console.error("Fetch error:", error);
            res.status(500).json({error: error.message});
        }
    }
);
app.delete("/delete/:id",
    (req,res)=>{
        try {
            let client = new MongoClient(url);
            client.connect();
            let db= client.db("tinder");
            let collec = db.collection("photos");
            let id= req.params.id;
            
            if (!id.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({error: "Invalid ID format"});
            }
            
            let _id = new ObjectId(id);

            collec.findOne({_id})
            .then((obj)=>{
                if (!obj) {
                    client.close();
                    return res.status(404).json({error: "Post not found"});
                }
                cloudinary.uploader.destroy(obj.file_name);
                return collec.deleteOne({_id});
            })
            .then((result)=>{
                client.close();
                res.json({success: true, data: result})
            })
            .catch((error)=>{
                client.close();
                console.error("Delete error:", error);
                res.status(500).json({error: error.message});
            });
        } catch(error) {
            console.error("Delete error:", error);
            res.status(500).json({error: error.message});
        }
    }
);

app.listen(port, () => {
    console.log(`express is running on port ${port}`);
});