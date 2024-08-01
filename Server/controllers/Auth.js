const User=require('../models/user');
const OTP=require('../models/OTP');
const otpGenerator=require('otp-generator');
const Profile=require('../models/Profile');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const mailSender=require('../utils/mailSender');
const mongoose=require('mongoose');

require('dotenv').config();

//sendOTP
exports.sendOTP=async (req,res)=>{
    try{
        //fetch email from user ki body
        const{email}=req.body;

        //check if user already exist
        const checkUserPresent=await User.findOne({email});

        //if user already exist , then return a responce
        if(checkUserPresent){
            return res.status(401).json({
                success:false,
                message:"User already registered",
            });
        }

        //generate otp
        var otp=otpGenerator.generate(6,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false,
        });
        console.log("OTP generated: ",otp);

        //chk unique otp or not
        var result=await OTP.findOne({otp:otp});
        while(result){
            otp=otpGenerator.generate(6,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false});
            result=await OTP.findOne({otp:otp});
        }
        //db call bar bar use nhi kr skte complexity increases
        //ase chk krneki jgah apn ase library ka use kr skte h jo har bar unique otp hi de

        const otpPayload={
            email,
            otp,
        }
        //create an entry for otp
        const otpBody=await OTP.create(otpPayload);
        console.log(otpBody);

        res.status(200).json({
            success:true,
            message:"OTP sent successfully",
            otp,
        });
    }catch(err){
        console.log(err);
        res.status(400).json({
            success:false,
            message:err.message,
        });
    }
}



//signUp
exports.signUp=async (req,res)=>{
    try{
        //data fetch from request body
        const {firstName,lastName,email,password,confirmPassword,accountType,otp,contactNumber}=req.body;

        //validate krlo
        if(!firstName || !lastName || !email || !password || !confirmPassword || !otp)
        {
            return res.status(403).json({
                success:false,
                message:"please enter all details completely ",
            })
        }

        //2 passwords ko match karo
        if(password!==confirmPassword)
        {
            return res.status(400).json({
                success:false,
                message:"password is not matching",
            })
        }
        //check user already exist
        const checkUserPresent=await User.findOne({email});

        if(checkUserPresent)
        {
            res.status(400).json({
                success:false,
                message:"user already registered",
            })
        }

        //find most recent otp
        const recentOTP=await OTP.find({email}).sort({createdAt:-1}).limit(1);
        console.log("recent OTP ", recentOTP);

        //validate OTP
        if(recentOTP.length===0)
        {
            return res.status(400).json({
                success:false,
                message:"OTP not found",
            })
        } else if(otp!==recentOTP[0].otp){
            //invalid OTP
            return res.status(400).json({
                success:false,
                message:"invalid otp",
            });
        }

        //hash pass
        const hashedPass=await bcrypt.hash(password,10);

        //entry in DB

        //profile details dalna tha esliye bana diya
        const profileDetails=await Profile.create({
            gender:null,
            dateOfBirth:null,
            about:null,
            contactNumber:null,
        });

        const user=await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            accountType,
            password:hashedPass,
            accountType,
            additionalDetails:profileDetails._id,
            image:`https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        });
        console.log(user.additionalDetails);
        console.log(user);
        return res.status(200).json({
            success:true,
            message:"User registered successfully",
            data:user,
        });

    }catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:"User cannot be registered.Please try again",
        })
    }
}

//Login
exports.login=async (req,res)=>{
    try{
        //data from request body
        const{email,password}=req.body;
        //validation data
        if(!email || !password)
        {
            return res.status(403).json({
                success:false,
                message:"Please enter details completely",
            })
        }
        //chk user alreday exist
        const user=await User.findOne({email});
        if(!user)
        {
            return res.status(401).json({
                success:false,
                message:"first signUp",
            })
        }

        if(await bcrypt.compare(password,user.password))
        {
            const payload={
                email:user.email,
                id:user._id,
                accountType:user.accountType,
            }
           //create jwt token
           const token=jwt.sign(payload,process.env.JWT_SECRET,
            {
                expiresIn:"2h",
            });
            user.token=token;
            user.password=undefined;

            //create cookie
            const options={
                expires:new Date(Date.now() + 3*24*60*60*1000),
                httpOnly:true,
            }
            res.cookie("token",token,options).status(200).json({
                success:true,
                token,
                user,
                message:"Logged in successfully",
            })
        }
        else{
            return res.status(401).json({
                success:true,
                message:"Password does not match",
            })
        }

        //create cookie and send responce
    }catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:"error in user logged in",
        })
    }
}

//change Password

exports.changePassword=async (req,res)=>{
    try{
        const {email,oldPassword,confirmPassword,newPassword}=req.body;

        if(!oldPassword || !newPassword || !confirmPassword)
        {
            return res.status(401).json({
                success:false,
                message:"Enter fields completely",
            })
        }
        const user=await User.findOne({email});
        if(oldPassword!==user.password)
        {
            return res.status(401).json({
                success:false,
                message:"Enter old Password correctly",
            });
        }
        if(newPassword!==confirmPassword)
        {
            return res.status(401).json({
                success:false,
                message:"new password and confirmed password are not same",
            });
        }
        const userId=user._id;
        const userPass=await User.findByIdAndUpdate({userId}
        ,{
            password:newPassword,
        },{
            new:true,
        });

        const sendMail=await mailSender(email,"Password changed successfuly",`updated password ${password}`);
        console.log(sendMail);
        return res.status(200).json({
            success:true,
            message:"Password chnaged successfully",
        })

    }catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:"error in changing password",
        });
    }
}