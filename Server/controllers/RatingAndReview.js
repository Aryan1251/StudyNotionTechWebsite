const {RatingAndReview}=require('../models/RatingAndReview');
const {Course}=require('../models/Course');
const { default: mongoose } = require('mongoose');

//create rating
exports.createRatingAndReview=async (req,res)=>{
    try{
        //get userId
        const userId=req.user.id;
        //fetch data
        const {courseId,rating,review}=req.body;
        //check if user is enrolled or not

        //1. way to match
        // const userDetails=await User.findById({_id:userId});
        // const currCourses=userDetails.courses;

        // if(!currCourses.includes(courseId))
        // {
        //     return res.status(400).json({
        //         success:false,
        //         message:"User is not enrolled in this course",
        //     });
        // }
        //2. way
        const courseDetails=await Course.findOne(
            {_id:courseId,
                studentsEnrolled:{$eleMatch: {$eq: userId}},
            });
        
        if(!courseDetails)
        {
            return res.status(400).json({
                success:false,
                message:"Student is not enrolled in course",
            });
        }
        //check if the user reviewed the course already(apn keval ek bar hi allow kr rhe h rec=view ka)
        const alreadyReviewed=await RatingAndReview.findOne({
            user:userId,
            course:courseId,
        });
        if(alreadyReviewed)
        {
            return res.status(400).json({
                success:false,
                message:"User can rate only once",
            });
        }
        //create rating and review
        const ratingReview=await RatingAndReview.create({
            user:userId,
            rating,
            review,
            course:courseId,
            user:userId,
        });

        //course model me add hogi
        const updatedCourseDetails=await Course.findByIdAndUpdate({courseId},
            {
                $push:{
                    ratingAndReviews:ratingReview._id,
                }
            },
            {new:true});
        console.log(updatedCourseDetails);
        //return res
        return res.status(200).json({
            success:true,
            message:"Rating and Review created successfully",
            ratingReview,
        });
    }catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:"Error in creating rating",
        });
    }
};

//getAverageRating
exports.getAverageRating=async (req,res)=>{
    try{
        //get courseID
        const {courseId}=req.body;
        //calculate avg rating
        const result=await RatingAndReview.aggregate([
            {
                $match:{
                    course:new mongoose.Schema.Types.ObjectId(courseId),
                },
            },
            {
                $group:{
                    _id:null,
                    averageRating:{$avg:"$rating"},
                }
            }
        ]);
        //return rating
        if(result.length>0)
        {
            return res.status(200).json({
                success:true,
                averageRating:result[0].averageRating,
            });
        }
        //if no rating/review exist
        return res.status(400).json({
            success:false,
            message:"Average rating is 0,no ratings given till now",
            averageRating:0,
        })
    }catch(err){
        console.error(err);
        return res.status(500).json({
            success:false,
            message:err.message,
        });
    }
}

//getAllRatingsandReview
//ye function sari hi rating and review leke aagaya kse bhi course ki
exports.getAllRating=async (req,res)=>{
    try{
        const allReviews=await RatingAndReview.find({})
        .sort({rating:"desc"})
        .populate({
            path:"user",
            select:"firstName lastName email image",
        })
        .populate({
            path:"course",
            select:"courseName",
        })
        .exec();
        //console.log(allReviews);
        return res.status(200).json({
            success:true,
            message:"All reviews fetched successfully",
            data:allReviews,
        });
    }catch(err){
        console.error(err);
        return res.status(500).json({
            success:false,
            message:err.message,
        });
    }
}