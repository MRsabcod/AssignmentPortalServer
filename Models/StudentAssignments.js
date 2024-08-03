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
                starred: {
                    type: Boolean,
                    default: false
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
                studentAttachedFileLinks:[{
                    type:String,
                }],
                grade:{
                    type:Number,
                    default:-1,
                    max:100
                    
                }

            }
        ],

    },
    totalPercentage:{
        type:Number,
        default : 0,
    },
    totalGrade:{
        type:Number,
        default : 0,
        },

})
const StudentAssignments=mongoose.model('StudentsAssignments',studentAssignemntSchema)
export default StudentAssignments
