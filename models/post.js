const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    user_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Register',
        required: true

    },
    brief:{
        type:String,
        required:true
    },
    image:{
        type:String,
    },
    article:{
        type:String,
        required:true
    }

});

const Post = new mongoose.model("Post", postSchema);

module.exports = Post;