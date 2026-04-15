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
app.use(cors({
  origin: true,
  credentials: true
}));
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

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "Instagram Clone Backend is running!" });
});

app.post("/upload", recep.single("file"), async (req, res) => {
  try {
    console.log("Upload request received");
    console.log("File:", req.file ? req.file.filename : "NO FILE");
    console.log("Body:", req.body);
    
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded by Cloudinary" });
    }
    
    if (!req.body.username) {
      return res.status(400).json({ error: "Username is required" });
    }

    let client = new MongoClient(url);
    await client.connect();
    let db = client.db("tinder");
    let collec = db.collection("photos");
    
    let obj = {
        username: req.body.username,
        caption: req.body.caption,
        file_url: req.file.path,
        file_name: req.file.filename,
        upload_time: new Date()
    };
    
    console.log("Saving to DB:", obj);
    let result = await collec.insertOne(obj);
    client.close();
    
    console.log("Upload successful");
    res.json({success: true, data: result});
  } catch(error) {
    console.error("Upload error:", error.message);
    res.status(500).json({error: error.message});
  }
});
app.get("/files", async (req,res) => {
    try {
        let client = new MongoClient(url);
        await client.connect();
        let db = client.db("tinder");
        let collec = db.collection("photos");
        let username = req.query.username;
        let obj = username ? {username} : {};
        
        let result = await collec.find(obj).toArray();
        client.close();
        res.json(result);
    } catch(error) {
        console.error("Fetch error:", error);
        res.status(500).json({error: error.message});
    }
});
app.delete("/delete/:id", async (req,res) => {
    try {
        let client = new MongoClient(url);
        await client.connect();
        let db = client.db("tinder");
        let collec = db.collection("photos");
        let id = req.params.id;
        
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({error: "Invalid ID format"});
        }
        
        let _id = new ObjectId(id);

        let obj = await collec.findOne({_id});
        if (!obj) {
            client.close();
            return res.status(404).json({error: "Post not found"});
        }
        await cloudinary.uploader.destroy(obj.file_name);
        let result = await collec.deleteOne({_id});
        client.close();
        
        res.json({success: true, data: result});
    } catch(error) {
        console.error("Delete error:", error);
        res.status(500).json({error: error.message});
    }
});

// Like / Unlike Post
app.post("/post/:id/like", async (req, res) => {
    try {
        let client = new MongoClient(url);
        await client.connect();
        let db = client.db("tinder");
        let collec = db.collection("photos");
        
        let id = req.params.id;
        let username = req.body.username;
        
        if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({error: "Invalid ID format"});
        if (!username) return res.status(400).json({error: "Username required"});
        
        let _id = new ObjectId(id);
        let post = await collec.findOne({_id});
        if (!post) {
            client.close();
            return res.status(404).json({error: "Post not found"});
        }
        
        let likes = post.likes || [];
        if (likes.includes(username)) {
            likes = likes.filter(u => u !== username); // Unlike
        } else {
            likes.push(username); // Like
        }
        
        await collec.updateOne({_id}, { $set: { likes } });
        client.close();
        
        res.json({ success: true, likes });
    } catch (error) {
        console.error("Like error:", error);
        res.status(500).json({error: error.message});
    }
});

// Add Comment
app.post("/post/:id/comment", async (req, res) => {
    try {
        let client = new MongoClient(url);
        await client.connect();
        let db = client.db("tinder");
        let collec = db.collection("photos");
        
        let id = req.params.id;
        let { username, text } = req.body;
        
        if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({error: "Invalid ID format"});
        if (!username || !text) return res.status(400).json({error: "Username and text required"});
        
        let _id = new ObjectId(id);
        let comment = {
            username,
            text,
            createdAt: new Date().toISOString(),
            id: new ObjectId().toString()
        };
        
        await collec.updateOne({_id}, { $push: { comments: comment } });
        let updatedPost = await collec.findOne({_id});
        client.close();
        
        res.json({ success: true, comments: updatedPost.comments });
    } catch (error) {
        console.error("Comment error:", error);
        res.status(500).json({error: error.message});
    }
});

// Get User Profile
app.get("/profile/:username", async (req, res) => {
    try {
        let client = new MongoClient(url);
        await client.connect();
        let db = client.db("tinder");
        let usersCollec = db.collection("users");
        
        let username = req.params.username;
        let profile = await usersCollec.findOne({ username });
        
        client.close();
        if (profile) {
            res.json(profile);
        } else {
            res.json({ username, bio: "Hello! Welcome to my profile. 🌟 Capturing moments.", pfp_url: "" });
        }
    } catch(error) {
        console.error("Profile fetch error:", error);
        res.status(500).json({error: error.message});
    }
});

// Update Profile (Bio & Image)
app.post("/profile/update", recep.single("pfp"), async (req, res) => {
    try {
        if (!req.body.username) {
            return res.status(400).json({ error: "Username is required" });
        }

        let updateData = {};
        if (req.body.bio !== undefined) updateData.bio = req.body.bio;
        if (req.file) {
            updateData.pfp_url = req.file.path; // Cloudinary URL
            updateData.pfp_name = req.file.filename;
        }

        let client = new MongoClient(url);
        await client.connect();
        let db = client.db("tinder");
        let usersCollec = db.collection("users");

        let result = await usersCollec.updateOne(
            { username: req.body.username },
            { $set: updateData },
            { upsert: true }
        );

        let updatedProfile = await usersCollec.findOne({ username: req.body.username });
        client.close();
        
        res.json({ success: true, profile: updatedProfile });
    } catch(error) {
        console.error("Profile update error:", error);
        res.status(500).json({error: error.message});
    }
});

// Follow / Unfollow User
app.post("/follow", async (req, res) => {
    try {
        const { currentUsername, targetUsername } = req.body;
        if (!currentUsername || !targetUsername) return res.status(400).json({ error: "Missing usernames" });
        if (currentUsername === targetUsername) return res.status(400).json({ error: "Cannot follow yourself" });

        let client = new MongoClient(url);
        await client.connect();
        let db = client.db("tinder");
        let usersCollec = db.collection("users");

        // Get current user to check following list
        let currentUserData = await usersCollec.findOne({ username: currentUsername });
        let following = currentUserData?.following || [];
        
        const isFollowing = following.includes(targetUsername);
        
        if (isFollowing) {
            // Unfollow
            await usersCollec.updateOne({ username: currentUsername }, { $pull: { following: targetUsername } });
            await usersCollec.updateOne({ username: targetUsername }, { $pull: { followers: currentUsername } });
        } else {
            // Follow
            await usersCollec.updateOne({ username: currentUsername }, { $push: { following: targetUsername } });
            await usersCollec.updateOne({ username: targetUsername }, { $push: { followers: currentUsername } });
        }
        
        client.close();
        res.json({ success: true, isFollowing: !isFollowing });
    } catch(error) {
        console.error("Follow logic error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`express is running on port ${port}`);
});