import express from 'express'
import StudentAssignments from '../Models/StudentAssignments.js'
import { upload } from '../middlewares/multer.js'
import mongoose from 'mongoose'
import { uploads } from '../middlewares/assignment.js'
import {gfs} from '../db/index.js'

const studentAssignmentsRouter=express.Router()
studentAssignmentsRouter.get("/",async(req,res)=>{
    const studentAssignments=await StudentAssignments.find()
    res.send(studentAssignments)

})
studentAssignmentsRouter.post("/submit",uploads.single('file'),async(req,res)=>{
    const studentAssignments=await StudentAssignments.findOne({studentId:req.body.studentId})
 if(studentAssignments){
    let studentAssignment= {
    assignmentId:req.body.assignmentId,
    studentAttachedLink:req.body.studentAttachedLink,
    studentAttachedFileId:req.file.id||null,
    studentAttachedFile:null

   }
   await studentAssignments.assignments.push(studentAssignment)
   const file = await gfs.find({_id:new mongoose.Types.ObjectId(req.file.id)}).toArray()
   // console.log(file[0])
   const fileToStream=await gfs.openDownloadStreamByName(file[0]?.filename).toArray()
//    const StreamToText=await fileToStream.toString('base64')
   const base64String = btoa(
    String.fromCharCode(...new Uint8Array(fileToStream[0]))
  );
  
  studentAssignments.assignments.pop()
  studentAssignment= {...studentAssignment,
    
    // studentAttachedFileContentType:file[0].con
    studentAttachedFile:base64String||null
    
 }
  await studentAssignments.assignments.push(studentAssignment)
// console.log(blob)
await studentAssignments.save()
    res.send({studentAssignments})
}})
studentAssignmentsRouter.post("/grade",async(req,res)=>{
  const studentAssignments=await StudentAssignments.findOne({studentId:req.body.studentId})
if(studentAssignments)
  studentAssignments.assignments.forEach(element => {
  if(element.assignmentId==req.body.assignmentId){
    element.grade=req.body.grade
  }
});
await studentAssignments?.save()
res.send({studentAssignments})
})
export default studentAssignmentsRouter