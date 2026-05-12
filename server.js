require("dotenv").config();
const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require('multer');
const Datastore = require('nedb-promises');
const app = express();
const PORT = process.env.PORT || 3000;

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

const usersDB = Datastore.create({ filename: path.join(__dirname, "data", "users.db"),
    autoload: true
});
const postsDB = Datastore.create({
    filename: path.join(__dirname, "data", "posts.db"),
    autoload: true
});
const likesDB = Datastore.create({
    filename: path.join(__dirname, "data", "likes.db"),
    autoload: true
});
const savesDB = Datastore.create({
    filename: path.join(__dirname, "data", "saves.db"),
    autoload: true
});

usersDB.ensureIndex({fieldName: "email", unique: true});

// For Image upload setup
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, path.join(__dirname, "public", "uploads"));
    },
    filename: function(req, file, cb){
        const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "-");
        cb(null, uniqueName);
    }
});
const upload = multer({storage});
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function makeToken(user){
    return jwt.sign({id: user._id, email: user.email, username: user.username}, 
        JWT_SECRET, {expiresIn: "2h"});
}
function requireAuth(req, res, next){
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({error: "Unauthorized"});
    }
    const token = authHeader.split(" ")[1];
    try{
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (error){
        return res.status(401).json({error: "Invalid token"});
    }
}

app.get("/api/test", (req, res) => {
    res.json({message: "Server is working!"});
});

app.post("/api/register", async (req, res) => {
    try{
        const {username, email, password} = req.body;
        if (!username || !email || !password){
            return res.status(400).json({error: "All fields are required"});
        }
        if (password.length < 6){
            return res.status(400).json({error: "Password must be at least 6 characters"});
        }
        const existingUser = await usersDB.findOne({email});
        if (existingUser){
            return res.status(400).json({error: "Email already in use"});
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await usersDB.insert({username, email, passwordHash, createdAt: new Date()});
        const safeUser = {_id: user._id, username: user.username, email: user.email};
        const token = makeToken(safeUser);
        res.json({message: "Registration successful", token, user: safeUser});
    }catch (error){
        res.status(500).json({error: "Registration failed"});
    }
});

app.post("/api/login", async (req, res) => {
    try{
        const {email, password} = req.body;
        const user = await usersDB.findOne({email});
        if (!user){
            return res.status(400).json({error: "Invalid email or password"});
        }
        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches){
            return res.status(400).json({error: "Invalid email or password"});
        }
        const safeUser = {_id: user._id, username: user.username, email: user.email};
        const token = makeToken(safeUser);
        res.json({message: "Login successful", token, user: safeUser});
    } catch (error){
        res.status(500).json({error: "Login failed"});
    }
});

app.get("/api/me", requireAuth, async (req, res) => {
    res.json({user: req.user});
});

app.get("/api/posts", async (req, res) => {
    try{
        const {tag, search} = req.query;
        let posts = await postsDB.find({}).sort({createdAt: -1});
        for (const post of posts){
            const user = await usersDB.findOne({_id: post.userId});
            const likes = await likesDB.count({postId: post._id});

            post.username = user ? user.username : "Unknown";
            post.likeCount = likes;
        }
        if (tag){
            posts = posts.filter(post => 
                post.tags.toLowerCase().includes(tag.toLowerCase())
        );
        }
        if (search){
            posts = posts.filter(post=>
                post.title.toLowerCase().includes(search.toLowerCase()) ||
                post.description.toLowerCase().includes(search.toLowerCase()) ||
                post.tags.toLowerCase().includes(search.toLowerCase())
        );
        }
        res.json(posts);
    } catch (error){
        res.status(500).json({error: "Could not load posts"});
    }
});

app.get("/api/posts/:id", async (req, res) => {
    try{
        const post = await postsDB.findOne({_id: req.params.id});
        if (!post){
            return res.status(404).json({error: "Post not found"});
        }
        const user = await usersDB.findOne({_id: post.userId});
        post.username = user ? user.username : "Unknown";
        res.json(post);
    } catch (error){
        res.status(500).json({error: "Could not load post"});
    }
});

app.post("/api/posts", requireAuth, upload.single("image"), async (req, res) => {
    try{
        const {title, description, tags} = req.body;
        if (!title || !description || !tags){
            return res.status(400).json({error: "Title, description, and tags are required"});
        }
        if (!req.file){
            return res.status(400).json({error: "Image is required"});
        }
        const imagePath = "/uploads/" + req.file.filename;

        const post = await postsDB.insert({
            title, imageUrl: imagePath, description, tags, userId: req.user.id, createdAt: new Date()
        });
        res.json({message: "Post created successfully", post});
    } catch (error){
        res.status(500).json({error: "Could not create post"});
    }
});

app.put("/api/posts/:id", requireAuth, upload.single("image"), async (req, res) => {
    try{
        const post = await postsDB.findOne({_id: req.params.id});
        if (!post){
            return res.status(404).json({error: "Post not found"});
        }
        if (post.userId !== req.user.id){
            return res.status(403).json({error: "You can only edit your own posts"});
        }
        const updatedPost = {
            title: req.body.title,
            description: req.body.description,
            tags: req.body.tags
        };
        if (req.file){
            updatedPost.imageUrl = "/uploads/" + req.file.filename;
        }
        await postsDB.update({_id: req.params.id}, {$set: updatedPost});
        res.json({message: "Post updated successfully"});
    } catch (error){
        res.status(500).json({error: "Could not update post"});
    }
});

app.delete("/api/posts/:id", requireAuth, async (req, res) => {
    try{
        const post = await postsDB.findOne({_id: req.params.id});
        if (!post){
            return res.status(404).json({error: "Post not found"});
        }
        if (post.userId != req.user.id){
            return res.status(403).json({error: "You can only delete your own posts"});
        }
        await likesDB.remove({postId: post._id}, {multi: true});
        await savesDB.remove({postId: post._id}, {multi: true});
        await postsDB.remove({_id: req.params.id});
        res.json({message: "Post deleted successfully"});
    } catch (error){
        res.status(500).json({error: "Could not delete post"});
    }
});

app.get("/api/my-posts", requireAuth, async (req, res) => {
    try{
        const posts = await postsDB.find({userId: req.user.id}).sort({createdAt: -1});
        res.json(posts);
    } catch(error){
        res.status(500).json({error: "Could not load your posts"});
    }
});

app.post("/api/posts/:id/like", requireAuth, async (req, res) => {
    try{
        const existingLike = await likesDB.findOne({ userId: req.user.id, postId: req.params.id});
        if (!existingLike){
            await likesDB.insert({userId: req.user.id, postId: req.params.id, createdAt: new Date()});
        }
        res.json({message: "Post liked successfully"});
    } catch (error){
        res.status(500).json({error: "Could not like post"});
    }
});

app.post("/api/posts/:id/save", requireAuth, async (req, res) => {
    try{
        const existingSave = await savesDB.findOne({userId: req.user.id, postId: req.params.id});
        if (!existingSave){
            await savesDB.insert({userId: req.user.id, postId: req.params.id, createdAt: new Date()});
        }
        res.json({message: "Post saved successfully"});
    } catch (error){
        res.status(500).json({error: "Could not save post"});
    }
});
app.get("/api/saved-posts", requireAuth, async (req, res) => {
    try{
        const saves = await savesDB.find({userId: req.user.id});
        const posts = [];
        for (const save of saves){
            const post = await postsDB.findOne({_id: save.postId});
            if (post){
                const user = await usersDB.findOne({_id: post.userId});
                post.username = user ? user.username : "Unknown";
                posts.push(post);
            }
        }
        res.json(posts);
    } catch (error){
        res.status(500).json({error: "Could not load saved posts"});
    }
});

app.listen(PORT, () =>{
    console.log(`Server is running on http://localhost:${PORT}`);
});