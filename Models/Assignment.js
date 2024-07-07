import mongoose from 'mongoose'
import {Schema} from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
const assignemntSchema=new Schema({
    title:{
        type:String,
        required:true
        },
        desc:{  
            type:String,
            required:true},

            teacherAttachedFile:{
                type:String,
            },
            assignmentOfStudents:[{
               cnic:{type:String},
               rollNo:{type:String},
               studentAttachedFile:{
                type:String
               }
            }],
            courseId:{
                type:String,
            }

})
const Assignment=mongoose.model('Assignment',assignemntSchema)
export default Assignment