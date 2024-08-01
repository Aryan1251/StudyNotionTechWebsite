const mongoose=require('mongoose');
const OTPSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true,
    },
    cratedAt:{
        type: Date,
        default:Date.now(),
        required:true,
        expires:5*60,
    },
    otp:{
        type:String,
        required:true,
    },  
});

//function to send emails
const mailSender=require('../utils/mailSender');
const emailTemplate=require('../mail/templates/emailVerificationTemplate');

async function sendVerificationEmail(email,otp){
    try{
        const mailResponce=await mailSender(email,"Verification email form study notion",emailTemplate(otp));
        console.log("Email send successfully :",mailResponce);

    }catch(err){
        console.log("Error occur while sending mail",err.message);
        throw err;
    }
}

OTPSchema.pre("save",async function(next) {

    //only send an email when a new document is created
    await sendVerificationEmail(this.email,this.otp);
    next();
})

module.exports=mongoose.model("OTP",OTPSchema);