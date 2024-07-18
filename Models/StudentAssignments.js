import mongoose, { Schema } from "mongoose";

const studentAssignemntSchema=new Schema({
    studentId:{
        type:String,
    },
    studentName:{
        type:String,
    },
    courseId:{
        type:String,
    },
    assignments:{
        type:[
            {
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
                studentAttachedFileId:{
                    type:String,
                },
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
    }

})
const StudentAssignments=mongoose.model('StudentsAssignments',studentAssignemntSchema)
export default StudentAssignments