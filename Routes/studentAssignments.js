import express from 'express'
import StudentAssignments from '../Models/StudentAssignments.js'
import upload from '../middlewares/multer.js'
import mongoose from 'mongoose'
import { uploads } from '../middlewares/assignment.js'
import { gfs } from '../db/index.js'
import uploadFile from '../utils/googleDrive.js'
import { ideahub_v1alpha } from 'googleapis'
const AssignmentuploadFile=async(files)=>{
  let fileNames=[];
    for (let f = 0; f < files.length; f++) {
     
      fileNames.push(await uploadFile(files[f]))
    }
    return fileNames
}
const studentAssignmentsRouter = express.Router()
studentAssignmentsRouter.get("/", async (req, res) => {
  const studentAssignments = await StudentAssignments.find()
  res.send(studentAssignments)

})
studentAssignmentsRouter.get('/:id',async(req,res)=>{
  const studentId=req.params.id
 
  const studentAssignments=await StudentAssignments.findOne({studentId}).select('-studentId -_id -__v')
  res.status(200).send(studentAssignments)
})
studentAssignmentsRouter.post("/submit", upload.any(), async (req, res) => {
  try {

    const fileNames=await AssignmentuploadFile(req.files)

    const  newStudentAssignment = {
      assignmentId: req.body.assignmentId,
      studentAttachedLinks: req.body.studentAttachedLink,
      studentAttachedFileLinks: fileNames || null,
    }
  

    const studentAssignment = await StudentAssignments.findOneAndUpdate(
      { studentId: req.body.studentId, 'courses.courseId': req.body.courseId},
      {
     $push:{'courses.$.courseAssignments':newStudentAssignment}
      },
      { new: true, useFindAndModify: false }
    );
  //  if(!studentAssignment)
  //   res.send({"msg":"assignment was not created "})
  res.send({studentAssignment})
   
  }
  catch (e) {
    console.error('Error fetching assignment:', e);
    res.status(500).send({ error: 'Internal server error' });
  }
})
studentAssignmentsRouter.get('/studentAssignment/:studentId', async (req, res) => {
  const studentId = req.params.studentId
  const assignmentId = req.body.assignmentId

  
  
  const studentAssignment = await StudentAssignments.aggregate([
    {
      $match: { studentId: studentId }
    },
    {
      $unwind: '$courses'
    },
    {
      $match: { 'courses.courseAssignments.assignmentId': assignmentId }
    },
    {
      $project: {
        _id: 0,
        courseAssignment: '$courses.courseAssignments'
      }
    }
  ]);

  res.status(200).send({studentAssignment})
})
studentAssignmentsRouter.patch('/edit/:id',upload.any(),async (req,res)=>{

try{
  const id = req.params.id
    const fileNames=await AssignmentuploadFile(req.files)

  const  existingStudentAssignment = {
    assignmentId:id,
    studentAttachedLinks: req.body.studentAttachedLink,
    studentAttachedFileLinks: fileNames || null,
  }

  const studentAssignment=await StudentAssignments.findOneAndUpdate(
    { studentId: req.body.studentId, 'courses.courseId': req.body.courseId,'courses.courseAssignments.assignmentId':id },
    {
      $set: { 'courses.$[course].courseAssignments.$[elem]': existingStudentAssignment }
    },
    {
      arrayFilters: [
        { 'course.courseId': req.body.courseId, },
        { 'elem.assignmentId': id }
      ],new:true
    }
    
  )
if(!studentAssignment)
  return res.status(404).send({message: 'Assignment not found'})
res.status(200).send({studentAssignment})
  
}
catch(e){
  res.send({msg:"erroror updating document",err:e.message})
}

})
studentAssignmentsRouter.delete('/del/:assignmentId',async(req,res)=>{
  const assignmentId = req.params.assignmentId
  const studentId = req.body.studentId



 const studentAssignmentDelelte= await StudentAssignments.findOneAndUpdate({studentId},{$pull:{"assignments":{"assignmentId":assignmentId}}})
  
 
if(studentAssignmentDelelte)
  res.status(200).send({msg:"sucessfully deleted",studentAssignmentDelelte})
res.status(404).send('not found')

})
studentAssignmentsRouter.post("/grade", async (req, res) => {
  const studentAssignments = await StudentAssignments.findOne({ studentId: req.body.studentId })
  if (studentAssignments)
    studentAssignments.assignments.forEach(element => {
      if (element.assignmentId == req.body.assignmentId) {
        element.grade = req.body.grade
      }
    });
  await studentAssignments?.save()
  res.send({ studentAssignments })
})
export default studentAssignmentsRouter