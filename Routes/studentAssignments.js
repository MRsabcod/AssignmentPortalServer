import express from 'express'
import StudentAssignments from '../Models/StudentAssignments.js'
import upload from '../middlewares/multer.js'
import mongoose from 'mongoose'
import { uploads } from '../middlewares/assignment.js'
import { gfs } from '../db/index.js'
import uploadFile from '../utils/googleDrive.js'

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
    const {files}=req
    let fileNames=[];
    for (let f = 0; f < files.length; f++) {
      // console.log(await uploadFile(files[f]))
      fileNames.push(await uploadFile(files[f]))
    }
    const  newStudentAssignment = {
      assignmentId: req.body.assignmentId,
      studentAttachedLinks: req.body.studentAttachedLink,
      studentAttachedFileLinks: fileNames || null,
    }
    const s=await StudentAssignments.findOne({'courses.courseAssignments.assignmentId':newStudentAssignment.assignmentId})

    const studentAssignment = await StudentAssignments.findOneAndUpdate(
      { studentId: req.body.studentId, 'courses.courseId': req.body.courseId,'courses.courseAssignments.assignmentId':newStudentAssignment.assignmentId },
      {
        $set: { 'courses.$[course].courseAssignments.$[elem]': newStudentAssignment }
      },
      {
        arrayFilters: [
          { 'course.courseId': req.body.courseId, },
          { 'elem.assignmentId': newStudentAssignment.assignmentId }
        ]
      }
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
      $match: { 'studentId': studentId }
    },
    {
      $project: {
        _id: 1,
        assignments: {
          $filter: {
            input: '$assignments',
            as: "assignment",
            cond: {

              $eq: ["$$assignment.assignmentId", assignmentId]

            }
          }
        }


      }
    }
  ])
  res.status(200).send({studentAssignment})
})
studentAssignmentsRouter.patch('/edit/:id',async (req,res)=>{
  const id = req.params.id

})
studentAssignmentsRouter.delete('/del/:assignmentId',async(req,res)=>{
  const assignmentId = req.params.assignmentId
  const studentId = req.body.studentId


  if(assignmentId && studentId){
  await StudentAssignments.findOneAndUpdate({studentId},{$pull:{"assignments":{"assignmentId":assignmentId}}})
  
  res.status(200).send({msg:"sucessfully deleted"})
}

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