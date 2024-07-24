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
studentAssignmentsRouter.post("/submit", uploads.array('files', 5), async (req, res) => {
  try {
    const fileNames = req.files.map(file => file.id);
    const studentAssignments = await StudentAssignments.findOne({ studentId: req.body.studentId})
   const newAssignment={ assignmentId: req.body.assignmentId,
    studentAttachedLink: req.body.studentAttachedLink,
    studentAttachedFileIds: fileNames || null,}
    const existingAssignmentIndex = studentAssignments.assignments.findIndex(
      assignment => assignment.assignmentId === newAssignment.assignmentId
    );

    if (existingAssignmentIndex !== -1) {
      // Overwrite existing assignment
      studentAssignments.assignments[existingAssignmentIndex] = newAssignment;
    } else {
      // Add new assignment
      studentAssignments.assignments.push(newAssignment);
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
      
      //    const file = await gfs.find({_id:new mongoose.Types.ObjectId(req.file.id)}).toArray()
      //    // console.log(file[0])
      //    const fileToStream=await gfs.openDownloadStreamByName(file[0]?.filename).toArray()
      // //    const StreamToText=await fileToStream.toString('base64')
      //    const base64String = btoa(
      //     String.fromCharCode(...new Uint8Array(fileToStream[0]))
      //   );

      //   studentAssignments.assignments.pop()
      //   studentAssignment= {...studentAssignment,

      //     // studentAttachedFileContentType:file[0].con
      //     studentAttachedFile:base64String||null

      //  }
      //   await studentAssignments.assignments.push(studentAssignment)
      // console.log(blob)

      studentAssignments.save()
      res.send({ studentAssignment:studentAssignments.assignments[existingAssignmentIndex] ,base64String })
    }
  }
  catch (e) {    console.error('Error fetching assignment:', e);
    res.status(500).json({ error: 'Internal server error' }); }
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