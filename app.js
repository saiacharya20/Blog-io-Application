const express = require("express");
const bodyParser = require("body-parser");
const mongodb = require("mongodb");
const multer = require('multer');
const dotenv = require("dotenv");
const path = require("path");
const bcrypt = require("bcrypt");
const port = process.env.PORT || 3000

require("./database/connection");
const Register = require('./models/register');
const Post = require('./models/post');

const app = express();

dotenv.config();

const storage = multer.diskStorage({
    destination:(req, file, cb) => {
        cb(null, './public/assets/img/demopic');
    },
    filename: (req, file, cb) => {
        console.log(file);
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({storage: storage}).single('image');

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login.ejs', (req, res) => {
    res.render('login');
});

app.get('/post.ejs', (req, res) => {
    res.render('post');
});

app.get('/user.ejs', (req, res) => {
    res.render('user');
});

app.get('/register.ejs', (req, res) => {
    res.render('register')
});

app.post('/user.ejs', upload, async (req,res) => {
    console.log(req.body.title);
    console.log(req.body.brief);
    console.log(req.file.filename);
    console.log(req.body.article);
    try {
        const newPost = new Post({
            title: req.body.title,
            brief: req.body.brief,
            image: req.file.filename,
            article: req.body.article
        });
     const posted = await newPost.save();
     res.status(201).render('index');
        
    }catch (error) {
        res.status(500).send(error);
    }
});

app.post('/register.ejs', async(req,res) => {
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    try {
        const registerUser = new Register({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            gender: req.body.gender,
            email: req.body.email,
            password: hashedPassword
        });
        const registered = await registerUser.save();
        res.status(201).render('login');
        
        
    } catch (error) {
        res.status(500).send(error);
    }
});

app.post('/login.ejs', async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const user = await Register.findOne({email:email});
        let isEqual = await bcrypt.compare(password, user.password)
        if(isEqual){
            res.status(201).render('user');
        }else{
            res.status(401).send("Invalid Credentials!");
        }

        
    } catch (error) {
        res.status(401).send('Invalid Credentials!')
    }
});
app.listen(port, () => {
    console.log('Server Running at http://localhost:3000');
});