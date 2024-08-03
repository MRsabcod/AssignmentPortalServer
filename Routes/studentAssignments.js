import express from 'express'
import StudentAssignments from '../Models/StudentAssignments.js'
import { upload } from '../middlewares/multer.js'
import mongoose from 'mongoose'
import { uploads } from '../middlewares/assignment.js'
import { gfs } from '../db/index.js'

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
studentAssignmentsRouter.post("/submit", uploads.array('files', 5), async (req, res) => {
  try {
    const fileNames = req.files.map(file => file.id);
    const studentAssignments = await StudentAssignments.findOne({ studentId: req.body.studentId })
    const newAssignment = {
      assignmentId: req.body.assignmentId,
      studentAttachedLink: req.body.studentAttachedLink,
      studentAttachedFileIds: fileNames || null,
    }
    const existingAssignmentIndex = studentAssignments.assignments.findIndex(
      assignment => assignment.assignmentId === newAssignment.assignmentId
    );

    if (existingAssignmentIndex !== -1) {
      // Overwrite existing assignment
      studentAssignments.assignments[await existingAssignmentIndex] = newAssignment;
    } else {
      // Add new assignment
      await studentAssignments.assignments.push(newAssignment);
    }
    let base64String = [];


    if (req.files && req.files.length > 0) {

      const filePromises = req.files.map(async file => {
        const files = await gfs.find({ _id: new mongoose.Types.ObjectId(file.id) }).toArray();
        if (files && files.length > 0) {
          const fileToStream = gfs.openDownloadStreamByName(files[0].filename);
          const chunks = [];

          fileToStream.on('data', (chunk) => {
            chunks.push(chunk);
          });

          return new Promise((resolve, reject) => {
            fileToStream.on('end', () => {
              const fileBuffer = Buffer.concat(chunks);
              const base64Data = fileBuffer.toString('base64');
              resolve(base64Data);
            });
            fileToStream.on('error', (err) => {
              reject(err);
            });
          });
        }
      })
      base64String = await Promise.all(filePromises);

    
      await studentAssignments.save()
      res.send({ studentAssignment: studentAssignments.assignments[studentAssignments?.assignments?.length-1], base64String })
    }
  }
  catch (e) {
    console.error('Error fetching assignment:', e);
    res.status(500).json({ error: 'Internal server error' });
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
studentAssignmentsRouter.delete('/del/:assignmentId',async(req,res)=>{
  const assignmentId = req.params.assignmentId
  const studentId = req.body.studentId
  const studentAssignment=await StudentAssignments.findOne({studentId},{assignments:{$elemMatch:{assignmentId}}})
  const studentAssignmentIds=(studentAssignment.assignments[0].studentAttachedFileIds)

  if(assignmentId && studentId){
  await StudentAssignments.findOneAndUpdate({studentId},{$pull:{"assignments":{"assignmentId":assignmentId}}})
  studentAssignmentIds.map((id)=>{
    
    gfs.delete(
      new mongoose.Types.ObjectId(id),
      (err, data) => {
        if (err) return res.status(404).json({ err: err.message });
       console.log(data);
      })
  })
}

  res.status(200).send({msg:"sucessfully deleted",studentAssignment})
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