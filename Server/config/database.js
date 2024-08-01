const mongoose=require('mongoose');
require('dotenv').config();

const connect=()=>{
    mongoose.connect(process.env.MONGODB_URL)
    .then(()=>{console.log("DB connection successful");})
    .catch((err)=>{
        console.log("DB connection failed");
        console.log(err);
        process.exit(1);
    })
}

module.exports=connect;