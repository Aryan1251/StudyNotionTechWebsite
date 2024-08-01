const jwt=require('jsonwebtoken');
require('dotenv').config();
const User=require('../models/user');


//auth
exports.auth=async (req,res,next)=>{
    try{
        //extract token
        const token=req.cookies.token 
        || req.body.token 
        || req.header("Authorisation").replace("Bearer ","");
        console.log(token);
        if(!token)
        {
            return res.status(401).json({
                success:false,
                message:"token is not present",
            })
        }
        //verify the token
        try{
            const decode=jwt.verify(token,process.env.JWT_SECRET);
            req.user=decode;
            console.log(decode);
        }catch(err){
            return res.status(401).json({
                success:false,
                message:"error in verifying jwtToken",
            });
        }
        next();
    }catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:"something went wrong while validating the token",
        });
    }
}

//isStudent
exports.isStudent=async (req,res,next)=>{
    try{
        if(req.user.accountType!=="Student")
        {
            return res.status(401).json({
                success:false,
                message:"this is a protected route for students only",
            })
        }
        next();
    }catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:"user role cannot be verified",
        })
    }
}

//isAdmin
exports.isAdmin=async (req,res,next)=>{
    try{
        if(req.user.accountType!=="Admin")
        {
            return res.status(401).json({
                success:false,
                message:"not a admin",
            });
        }
        next();
    }catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:"error",
        })
    }
}

//isInstructor 
exports.isInstructor=async (req,res,next)=>{
    try{
        if(req.user.accountType!=="Instructor")
        {
            return res.status(401).json({
                success:false,
                message:"not a Instructor",
            });
        }
        next();
    }catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:"error",
        })
    }
}
