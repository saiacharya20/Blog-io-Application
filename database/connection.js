const mongoose = require('mongoose');
const dotenv = require('dotenv')
dotenv.config();

mongoose.connect(process.env.MONGODB_HOST, {
    useNewUrlParser:true,
    useUnifiedTopology:true,
}).then(() => {
    console.log("Connection Successful")
}).catch((error) => {
    console.log(error)
})