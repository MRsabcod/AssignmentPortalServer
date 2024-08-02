import express from 'express'
import Course from '../Models/Course.js'
const courseRouter=express.Router()
courseRouter.get('/:id',async(req,res)=>{
    
    const courses=await Course.findById(req.params.id)
    res.send({courses})
})
export default courseRouter
