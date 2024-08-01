
const User=require('../models/user');
const mailSender=require('../utils/mailSender');
const bcrypt=require('bcrypt');
const crypto=require('crypto');

//resetPasswordToken
exports.resetPasswordToken= async (req,res)=>{
    try{
        //get email from req body
        const {email}=req.body;
        //chk user for this email
        const user=await User.findOne({email});
        if(!user)
        {
            return res.status(401).json({
                success:false,
                message:"Your email is not registered with us",
            })
        }
        //generate token
        const token=crypto.randomUUID();
        //upadate user by adding token and expiration time
        const updatedDetails=await User.findOneAndUpdate(
            {email:email},
            {
                token:token,
                resetPasswordExpires:Date.now() + 5*60*1000,
            },{new:true});
        
        //create url
        const url=`http://localhost:3000/update-password/${token}`
    
        //send mail containig url
        await mailSender(email,"Password Reset Link",`Password Reset Link: ${url}`);

        //send responce
        return res.status(200).json({
            success:true,
            message:"email send successfully please check email and change password",
            token
        })

    }catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:"Something went wrong",
        })
    }
}

//resetPassword
exports.resetPassword=async (req,res)=>{
    try{
        //data fetch
        const {token,password,confirmedPassword}=req.body;
        //validation 
        if(password!==confirmedPassword)
        {
          return res.status(401).json({
              success:false,
              message:"password is not matching to confirmed Password",
          });
        }
        //get userDetails
        const user=await User.findOne({token});
        //if noEntry invalid token
        if(!user){
          return res.status(401).json({
              success:false,
              message:"invalid tokken",
          });
        }

        //toke time check
        if(user.resetPasswordExpires<Date.now()){
          return res.status(401).json({
              success:false,
              message:"token expires",
          });
        }
        //hash Password
        const hashedPassword=await bcrypt.hash(password,10);

        //update password in DB
        //console.log("dd");
        const upadateUser=await User.findOneAndUpdate({token:token},
          {password:hashedPassword},
          {new:true});
        return res.status(200).json({
          success:true,
          message:"password reset successfully",
        });
    }catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:"Something went wrong in resting the password",
        });
    }
}