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
const { getMaxListeners } = require("process");
const { request } = require("http");

const app = express();

dotenv.config();

const storage = multer.diskStorage({
    destination:(req, file, cb) => {
        cb(null, './public/assets/img/demopic');
    },
    filename: (req, file, cb) => {
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
        next();
    }
}

app.get('/', isAuthenticated,(req, res) => {
    Post.find({}).populate('user_id').exec(function (error, posts) {
        try {
            res.render('index', {
                postList : posts,
                count: posts.length
            });
            
        } catch (error) {
            res.send(error);
        }
            
    });
    
});

app.get('/about', isAuthenticated, (req, res) => {
    res.render('about');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/post', isAuthenticated, (req, res) => {
    Post.findById(req.query.id).populate('user_id').exec(function (error, post){
        try {
            res.render('post', {
                postData: post
            });
            
        } catch (error) {
            res.send(error)
        }
    })
});

app.get('/deletePosts', async (req, res) => {
    const post_id = req.query.id
    try {
        const edit = await Post.findByIdAndDelete(post_id)
        res.status(201).redirect('userPosts');
        
    }catch (error) {
        res.status(404).send(error);
    } 
 

});
    
app.get('/create', isAuthenticated, (req, res) => {
    res.render('create');
});

app.get('/userPosts',isAuthenticated, async (req, res) => {
    Register.find({email: req.session.user}, {_id:1}, async function (error, userid) {
        try {
            userPost = await Post.find({user_id: userid});
            res.render('userPosts', {
                postList: userPost,
                count:userPost.length
            });
            
        } catch (error) {
            res.send(error);
        }
            
    });
});

app.get('/editPosts',isAuthenticated, async(req, res) => {
    Post.findById(req.query.pid).populate('user_id').exec(function (error, editPost){
        try {
            res.render('editPosts',{
                editPost: editPost
            });
            
        } catch (error) {
            res.send(error)
        }
    })
});

app.post('/editPosts', isAuthenticated, async (req, res) => {
    const post_id = req.body.id
    try {
        const edit = await Post.findByIdAndUpdate(post_id, {
            title: req.body.title,
            article: req.body.article
        });
        const edited = await edit.save()
        res.status(201).redirect('userPosts');
        
    }catch (error) {
        res.status(404).send(error);
    } 
 
})

app.get('/register', (req, res) => {
    res.render('register')
});

app.post('/create', upload, isAuthenticated, async (req,res) => {
    const email = req.session.user;
    const user = await Register.findOne({email:email});
    const userid =user._id;
    try {
        const newPost = new Post({
            title: req.body.title,
            user_id: userid,
            image: req.file.filename,
            article: req.body.article
        });
     const posted = await newPost.save();
     res.status(201).redirect('/');
        
    }catch (error) {
        res.status(404).send(error);
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
        res.status(404).send(error);
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
            res.status(201).redirect('/');
        }else{
            res.status(401).render('login')
        }

        
    } catch (error) {
        res.status(401).send(error)
    }
});

app.get('/logout', (req,res) => {
    req.session.destroy();
    res.redirect('login');
})
app.listen(port, () => {
    console.log('Server Running at http://localhost:3000');
});