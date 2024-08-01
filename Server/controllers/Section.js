const Section=require('../models/Section');
const Course=require('../models/Course');
const CourseProgress = require('../models/CourseProgress');
const SubSection=require('../models/SubSection');

exports.createSection=async (req,res)=>{
    try{
        //data fetch
        const {sectionName,courseId}=req.body;
        //data validation
        if(!sectionName || !courseId)
        {
            return res.status(401).json({
                success:false,
                message:"Missing Details",
            });
        }
        //create section
        const newSection=await Section.create({
            sectionName,
        });

        //update course with section objectId
        const updatedCourse=await Course.findByIdAndUpdate(courseId,
        {
            $push:{
                courseContent:newSection._id,
            }
        },
        {
            new:true,
        })
        .populate({
            path:"courseContent",
            populate:{
                path:"subSection",
            },
        })
        .exec();
        //H.W - use populate to replace section/sub-sections both in the updatedCourseDetails
        //return responce
        //console.log("Updated course details ",updatedCourseDetails);
        return res.status(200).json({
            success:true,
            message:"Section created sccessfully",
            updatedCourse,
        });
    }catch(err){
        console.log("error in creating a section");
        return res.status(500).json({
            success:false,
            message:err.message,
        }); 
    }
}

exports.updateSection=async (req,res)=>{
    try {
        const { sectionName, sectionId, courseId } = req.body
        const section = await Section.findByIdAndUpdate(
          sectionId,
          { sectionName },
          { new: true }
        )
        const course = await Course.findById(courseId)
          .populate({
            path: "courseContent",
            populate: {
              path: "subSection",
            },
          })
          .exec()
        console.log(course)
        res.status(200).json({
          success: true,
          message: section,
          data: course,
        })
      } catch (error) {
        console.error("Error updating section:", error)
        res.status(500).json({
          success: false,
          message: "Internal server error",
          error: error.message,
        })
      }
}

exports.deleteSection = async (req, res) => {
    try {
      const { sectionId, courseId } = req.body
      await Course.findByIdAndUpdate(courseId, {
        $pull: {
          courseContent: sectionId,
        },
      })
      const section = await Section.findById(sectionId)
      console.log(sectionId, courseId)
      if (!section) {
        return res.status(404).json({
          success: false,
          message: "Section not found",
        })
      }
      // Delete the associated subsections
      await SubSection.deleteMany({ _id: { $in: section.subSection } })
  
      await Section.findByIdAndDelete(sectionId)
  
      // find the updated course and return it
      const course = await Course.findById(courseId)
        .populate({
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        })
        .exec()
  
      res.status(200).json({
        success: true,
        message: "Section deleted",
        data: course,
      })
    } catch (error) {
      console.error("Error deleting section:", error)
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      })
    }
  }