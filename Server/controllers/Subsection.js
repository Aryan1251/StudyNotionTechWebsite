const SubSection=require('../models/SubSection');
const Section=require('../models/Section');
const uploadTocloudinary= require('../utils/imageUploader');
const { findByIdAndUpdate, findById } = require('../models/category');

require('dotenv').config();

exports.createSubSection=async (req,res)=>{
    try{
        //fetch data from req body
        const {sectionId,title,description}=req.body;
        console.log("sectionId ", sectionId);
        //extract file/video
        const video=req.files.video;

        //validation
        if(!sectionId || !title  || !description || !video)
        {
            return res.status(401).json({
                success:false,
                message:"All fields are required",
            });
        }
        //upload video to cloudinary
        const uploadDetails=await uploadTocloudinary(video,process.env.FOLDER_NAME);
        console.log("upload Details ",uploadDetails);
        //create subsection
        const subSectionDetails=await SubSection.create({
            title:title,
            timeDuration:`${uploadDetails.duration}`,
            description:description,
            videoUrl:uploadDetails.secure_url,
        });
        //update section with this sub section objectId
        const updatedSection=await Section.findByIdAndUpdate({_id:sectionId},
            {
                $push:{
                    subSection:subSectionDetails._id,
                }
            },
            {
                new:true,
            }).populate("subSection");
        //HW log updated section here after adding populate query
        //return res
        return res.status(200).json({
            success:true,
            message:"subsection created successfully",
            data:updatedSection,
        });

    }catch(err){
        return res.status(500).json({
            success:false,
            message:"Error in creating subsection",
            error:err.message,
        });
    }
}

//HW 1.updateSubsection
exports.updateSubSection=async (req,res)=>{
    try {
        const { sectionId, subSectionId, title, description } = req.body
        const subSection = await SubSection.findById(subSectionId)
    
        if (!subSection) {
          return res.status(404).json({
            success: false,
            message: "SubSection not found",
          })
        }
    
        if (title !== undefined) {
          subSection.title = title
        }
    
        if (description !== undefined) {
          subSection.description = description
        }
        if (req.files && req.files.video !== undefined) {
          const video = req.files.video
          const uploadDetails = await uploadImageToCloudinary(
            video,
            process.env.FOLDER_NAME
          )
          subSection.videoUrl = uploadDetails.secure_url
          subSection.timeDuration = `${uploadDetails.duration}`
        }
    
        await subSection.save()
    
        // find updated section and return it
        const updatedSection = await Section.findById(sectionId).populate(
          "subSection"
        )
    
        console.log("updated section", updatedSection)
    
        return res.json({
          success: true,
          message: "Section updated successfully",
          data: updatedSection,
        })
      } catch (error) {
        console.error(error)
        return res.status(500).json({
          success: false,
          message: "An error occurred while updating the section",
        })
      }
}
//2.deleteSubsection
exports.deleteSubSection=async (req,res)=>{
    try {
        const { subSectionId, sectionId } = req.body
        await Section.findByIdAndUpdate(
          { _id: sectionId },
          {
            $pull: {
              subSection: subSectionId,
            },
          }
        )
        const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })
    
        if (!subSection) {
          return res
            .status(404)
            .json({ success: false, message: "SubSection not found" })
        }
    
        // find updated section and return it
        const updatedSection = await Section.findById(sectionId).populate(
          "subSection"
        )
    
        return res.json({
          success: true,
          message: "SubSection deleted successfully",
          data: updatedSection,
        })
      } catch (error) {
        console.error(error)
        return res.status(500).json({
          success: false,
          message: "An error occurred while deleting the SubSection",
        })
      }
}
