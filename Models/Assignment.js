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

            teacherAttachedFileId:{
                type:String,
            },
            teacherAttachedLink:{
                type:String,
            },
            teacherAttachedFile:{
                type:[String],

            },
            courseId:{
                type:String,
            }

})
const Assignment=mongoose.model('Assignment',assignemntSchema)
export default Assignment