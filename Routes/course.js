import express from 'express'
import Course from '../Models/Course.js'
const courseRouter=express.Router()
courseRouter.get('/',async(req,res)=>{
    const courses=await Course.find()
    res.send({courses})
})

export default courseRouter
