import mongoose from 'mongoose'
import {Schema} from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
const assignemntSchema=new Schema({
    title:{
        type:String,
        required:true
        },
        maxMarks:{
            type:Number,
            default:100
        },
        deadline:{
            required:true,
            type:Date,
        },
        desc:{  
            type:String,
            },

            teacherAttachedFileLinks:[{
                type:String,
            }],
            teacherAttachedLink:{
                type:String,
            },
          
            courseId:{
                type:String,
            }

})
const Assignment=mongoose.model('Assignment',assignemntSchema)
export default Assignment