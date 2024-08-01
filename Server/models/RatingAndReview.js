const mongoose=require('mongoose');

const RatingAndReviewSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"User",
    },
    course:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"Course",
        index:true,
    },
    rating:{
        type:Number,
        required:true,
    },
    review:{
        type:String,
        trim:true,
    }
});
module.exports=mongoose.model("RatingAndReview",RatingAndReviewSchema);