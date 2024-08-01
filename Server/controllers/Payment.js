const {instance}=require('../config/razorpay');
const Course=require('../models/Course');
const User=require('../models/user');
const mailSender=require('../utils/mailSender');
const {courseEnrollmentEmail}=require('../mail/templates/courseEnrollmentEmail');

//capture the payment and initiate the razorpay order
exports.capturePayment=async (req,res)=>{
    //getc course id and userId
    const {courseId}=req.body;
    const userId=req.user.id;
    //validation
    //valid course Id
    if(!courseId){
        return res.status(400).json({
            success:false,
            message:"please provide valid courseId",
        });
    }
    //valid course details
    let course;
    try{
        course=await Course.findById(courseId);
        if(!course)
        {
            return res.status(404).json({
                success:false,
                message:"could not find the course",
            });
        }
        //user already present
        //userId jo string me exist kr rhi thi convert kiya h object id me
        //kyuki vo courses me studentsEnroll me object ki form me hi store thi
        const uid=new mongoose.Types.ObjectId(userId);
        if(course.studentsEnrolled.includes(uid)) {
            return res.status(200).json({
                success:false,
                message:"Student is already enrolled"
            });
        }
    }catch(err){
        console.error(err);
        return res.status(500).json({
            success:false,
            message:err.message,
        });
    }
    //order create
    //amount and currency are mandatory
    const amount=Course.price;
    const currency="INR";
    
    const options={
        amount:amount*100,//multiply by 100 krke bhete h 
        currency,
        receipt:Math.random(Date.now()).toString(),
        notes:{
            courseId:courseId,
            userId,
        }
    };

    try{
        //initiate the payment using razorpay
        const paymentResponce=await instance.orders.create(options);
        console.log(paymentResponce);
        //return responce
        return res.status(200).json({
            success:true,
            courseName:course.courseName,
            courseDescription:course.courseDescription,
            thumbnail:course.thumbnail,
            orderId:paymentResponce.id,
            currency:paymentResponce.currency,
            amount:paymentResponce.amount,
        });
    }catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:"Could not initiate order",
        });
    }
};

//verify signature
exports.verifyPayment=async (req,res)=>{
    const webhookSecret="12345678"; 
    const signature=req.headers["x-razorpay-signature"];
    
    const shasum=crypto.createHmac("sha256",webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest=shasum.digest("hex");

    if(signature===digest)
    {
        console.log("payment is authorised"); 
        const {userId,courseId}=req.body.payload.payment.entity.notes;

        try{
            //fulfill action
            //find the course and enroll the student in it
            const enrolledCourse=await Course.findOneAndUpdate({courseId},
                {
                $push:{studentsEnrolled:userId}
                },
                {new:true});
            
                if(!enrolledCourse)
                {
                    return res.status(404).json({
                        success:false,
                        message:"Course not found",
                    });
                }
            console.log(enrolledCourse);
                //find the student and add the course to list of enrolled courses
            const enrolledStudent=await User.findOneAndUpdate({userId},{
                $push:
                {
                    courses:courseId,
                }
            },
            {
                new:true,
            });
            console.log(enrolledStudent);
            //mail jaega ab confirmation ka
            const emailResponce=await mailSender(
                enrolledStudent.email,
                "Congratulations from CodeHelp",
                "Congratulations, you are onboarded into new CodeHelp Course",
            );

            console.log(emailResponce);
            return res.status(200).json({
                success:true,
                message:"Signature verififed and coure added",
            });

        }catch(err){
            console.log(err);
            return res.status(500).json({
                success:false,
                message:err.message,
            });
        }
    }
    else
    {
        return res.status(400).json({
            success:false,
            message:"Signature not verified",
        });
    }
}

exports.sendPaymentSuccessEmail = async (req, res) => {
    const { orderId, paymentId, amount } = req.body
  
    const userId = req.user.id
  
    if (!orderId || !paymentId || !amount || !userId) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide all the details" })
    }
  
    try {
      const enrolledStudent = await User.findById(userId)
  
      await mailSender(
        enrolledStudent.email,
        `Payment Received`,
        paymentSuccessEmail(
          `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
          amount / 100,
          orderId,
          paymentId
        )
      )
    } catch (error) {
      console.log("error in sending mail", error)
      return res
        .status(400)
        .json({ success: false, message: "Could not send email" })
    }
}
  
// enroll the student in the courses
  exports.enrolledStudents = async (courses, userId, res) => {
    if (!courses || !userId) {
      return res
        .status(400)
        .json({ success: false, message: "Please Provide Course ID and User ID" })
    }
  
    for (const courseId of courses) {
      try {
        // Find the course and enroll the student in it
        const enrolledCourse = await Course.findOneAndUpdate(
          { _id: courseId },
          { $push: { studentsEnroled: userId } },
          { new: true }
        )
  
        if (!enrolledCourse) {
          return res
            .status(500)
            .json({ success: false, error: "Course not found" })
        }
        console.log("Updated course: ", enrolledCourse)
  
        const courseProgress = await CourseProgress.create({
          courseID: courseId,
          userId: userId,
          completedVideos: [],
        })
        // Find the student and add the course to their list of enrolled courses
        const enrolledStudent = await User.findByIdAndUpdate(
          userId,
          {
            $push: {
              courses: courseId,
              courseProgress: courseProgress._id,
            },
          },
          { new: true }
        )
  
        console.log("Enrolled student: ", enrolledStudent)
        // Send an email notification to the enrolled student
        const emailResponse = await mailSender(
          enrolledStudent.email,
          `Successfully Enrolled into ${enrolledCourse.courseName}`,
          courseEnrollmentEmail(
            enrolledCourse.courseName,
            `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
          )
        )
  
        console.log("Email sent successfully: ", emailResponse.response)
      } catch (error) {
        console.log(error)
        return res.status(400).json({ success: false, error: error.message })
      }
    }
}