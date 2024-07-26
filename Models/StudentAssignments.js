import mongoose, { Schema } from "mongoose";

const studentAssignemntSchema=new Schema({
    studentId:{
        type:String,
    },
    studentName:{
        type:String,
    },
    
    
    assignments:{
        type:[
            {
                courseId:{
                    type:String,
                },
                assignmentId:{
                    type:String,
                },
                studentAttachedLink:{
                    type:String,
                },
                studentAttachedFile:{
                    type:String,
                },
                studentAttachedFileContentType:{
                    type:String,
                },
                studentAttachedFileIds:[{
                    type:String,
                }],
                grade:{
                    type:Number,
                    default:0,
                    max:100
                    
                }

            }
        ],

    },
    totalPercentage:{
        type:Number,
        default : 0,
    }

})
const StudentAssignments=mongoose.model('StudentsAssignments',studentAssignemntSchema)
export default StudentAssignments
