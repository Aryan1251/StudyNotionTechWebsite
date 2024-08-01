const { listenerCount } = require('../models/OTP');
const Profile=require('../models/Profile');
const User=require('../models/user');
const uploadToCloudinary=require('../utils/imageUploader');
const monogoose=require('mongoose');

exports.updateProfile=async (req,res)=>{
    try{
        let {gender="",dateOfBirth="",about="",contactNumber=""}=req.body;
        const id=req.user.id;

        //data validation
        if(!gender || !contactNumber)
        {
            return res.status(200).json({
                success:false,
                message:"Please fill all details",
            });
        }
        //update profile
        const userDetails=await User.findById({_id:id});

        let profileId=userDetails.additionalDetails;
        profileId=new monogoose.Types.ObjectId(profileId);
        //update profile

        //console.log(gender,dateOfBirth,about,contactNumber);
        const updateProfile=await Profile.findById({_id:profileId});
        // console.log(updateProfile);

        updateProfile.gender=gender;
        updateProfile.about=about;
        updateProfile.contactNumber=contactNumber;
        updateProfile.dateOfBirth=dateOfBirth;

        await updateProfile.save();
        //return res
        return res.status(200).json({
            success:true,
            message:"Profile updated successfully",
            updateProfile,
        });

    }catch(err){
        return res.status(500).json({
            success:false,
            message:"error in updating profile",
            error:err.message,
        });
    }
}

//deleteAccount
exports.deleteAccount=async (req,res)=>{
    try{
        //get id
        const id=req.user.id;

        //validtion
        const userDetails=await User.findById({_id:id});
        if(!userDetails)
        {
            return res.status(401).json(
                {
                    success:false,
                    message:"User not found",
                }
            )
        }
        //delete user profile
        const profileId=userDetails.additionalDetails;
        await Profile.findByIdAndDelete({_id:profileId});
        //delete user
        //TODO :HW uneroll user from all enrolled courses
        await User.findByIdAndDelete({_id:id});
        //return res
        return res.status(200).json({
            success:true,
            message:"User deleted successfully",
        });
    }catch(err){
        return res.status(500).json({
            success:false,
            message:"Error in deleting user profile",
            error:err.message,
        });
    }
}

exports.getAllUserDetails=async (req,res)=>{
    try{
        const id=req.user.id;
        const userDetails=await User.find({_id:id}).populate("additionalDetails").exec();
    
        return res.status(200).json({
            success:true,
            message:"user data fetched successfully",
            userDetails
        });
    }catch(err){
        return res.status(500).json({
            success:false,
            message:"Error in fetching user Details",
            error:err.message,
        });
    }
}

exports.updateDisplayPicture = async (req, res) => {
    try {
      const displayPicture = req.files.displayPicture
      const userId = req.user.id
      const image = await uploadToCloudinary(
        displayPicture,
        process.env.FOLDER_NAME,
        1000,
        1000
      )
      console.log(image)
      const updatedProfile = await User.findByIdAndUpdate(
        { _id: userId },
        { image: image.secure_url },
        { new: true }
      )
      res.send({
        success: true,
        message: `Image Updated successfully`,
        data: updatedProfile,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
}

exports.getEnrolledCourses = async (req, res) => {
    try {
      const userId = req.user.id
      let userDetails = await User.findOne({
        _id: userId,
      })
        .populate({
          path: "courses",
          populate: {
            path: "courseContent",
            populate: {
              path: "subSection",
            },
          },
        })
        .exec()
      userDetails = userDetails.toObject();
  
      if (!userDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find user with id: ${userDetails}`,
        })
      }
      return res.status(200).json({
        success: true,
        data: userDetails.courses,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
}

exports.instructorDashboard = async (req, res) => {
    try {
      const courseDetails = await Course.find({ instructor: req.user.id })
  
      const courseData = courseDetails.map((course) => {
        const totalStudentsEnrolled = course.studentsEnroled.length
        const totalAmountGenerated = totalStudentsEnrolled * course.price
  
        // Create a new object with the additional fields
        const courseDataWithStats = {
          _id: course._id,
          courseName: course.courseName,
          courseDescription: course.courseDescription,
          // Include other course properties as needed
          totalStudentsEnrolled,
          totalAmountGenerated,
        }
  
        return courseDataWithStats
      })
  
      res.status(200).json({ courses: courseData })
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: "Server Error" })
    }
}