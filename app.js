const express = require("express");
const bodyParser = require("body-parser");
const mongodb = require("mongodb");
const multer = require('multer');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const mongoDBStore = require('connect-mongodb-session')(session);
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
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

const store = new mongoDBStore({
    uri:process.env.MONGODB_HOST,
    collection:'mySessions'
});

app.use(session({
    secret:'secretKey1200',
    resave: false,
    saveUninitialized:false,
    cookie:{maxAge: 1000 * 60 * 60 * 2},
    store:store
}));

const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        res.locals.username = req.session.user;
        next();
    }else{
        res.render('index')
    }
}

app.get('/', isAuthenticated, (req, res) => {
    res.render('index');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/post', isAuthenticated, (req, res) => {
    res.render('post');
});

app.get('/user', isAuthenticated, (req, res) => {
    res.render('user');
});

app.get('/userPosts',isAuthenticated, (req, res) => {
    res.render('userPosts');
});

app.get('/editPosts',isAuthenticated, (req, res) => {
    res.render('editPosts');
});

app.get('/register', (req, res) => {
    res.render('register')
});

app.post('/user', upload, isAuthenticated, async (req,res) => {
    const email = req.session.user;
    const user = await Register.findOne({email:email});
    const userid =user._id;
    try {
        const newPost = new Post({
            title: req.body.title,
            brief: req.body.brief,
            user_id: userid,
            image: req.file.filename,
            article: req.body.article
        });
     const posted = await newPost.save();
     res.status(201).render('index');
        
    }catch (error) {
        res.status(500).send(error);
    }
});

app.post('/register', async(req,res) => {
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

app.post('/login', async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const user = await Register.findOne({email:email});
        let isEqual = await bcrypt.compare(password, user.password)
        if(isEqual){
            req.session.user = req.body.email;
            res.status(201).redirect('user');
        }else{
            res.status(401).send("Invalid Credentials!");
        }

        
    } catch (error) {
        res.status(401).send('Invalid Credentials!')
    }
});

app.get('/logout', (req,res) => {
    req.session.destroy();
    res.redirect('/');
})
app.listen(port, () => {
    console.log('Server Running at http://localhost:3000');
});