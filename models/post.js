const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    brief:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    article:{
        type:String,
        required:true
    }

});

const Post = new mongoose.model("Post", postSchema);

module.exports = Post;