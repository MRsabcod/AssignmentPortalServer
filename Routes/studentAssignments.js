import express from 'express'
import StudentAssignments from '../Models/StudentAssignments.js'
import upload from '../middlewares/multer.js'
import mongoose from 'mongoose'
import { uploads } from '../middlewares/assignment.js'
import { gfs } from '../db/index.js'
import uploadFile from '../utils/googleDrive.js'
import { ideahub_v1alpha } from 'googleapis'
import Assignment from '../Models/Assignment.js'
import User from '../Models/User.js'
import cron from 'node-cron';
const AssignmentuploadFile = async (files) => {
  let fileNames = [];
  for (let f = 0; f < files.length; f++) {

    fileNames.push(await uploadFile(files[f]))
  }
  return fileNames
}
cron.schedule('21 4 * * *', async () => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate());

  try {
    // Fetch assignments with deadlines older than one week
    const outdatedAssignments = await Assignment.find({
      deadline: { $lt: oneWeekAgo }
    }).select('_id');
console.log(outdatedAssignments)
    const outdatedAssignmentIds = outdatedAssignments.map(assignment => assignment._id.toString());

    // Remove outdated assignments from StudentAssignments
    const updated = await StudentAssignments.updateMany(
      {},
      {
        $pull: {
          'courses.$[].courseAssignments': {
            assignmentId: { $in: outdatedAssignmentIds },
            starred:false
          }
        }
      }
    );

    console.log(`${updated} documents updated, outdated assignments removed.`);
  } catch (error) {
    console.error('Error removing outdated assignments:', error);
  }
});
const studentAssignmentsRouter = express.Router()
studentAssignmentsRouter.get("/:studentId/:courseId/assignments", async (req, res) => {
  try {
    const { studentId,courseId } = req.params;


    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }

    const student = await User.findById(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const assignments = await Assignment.find({ courseId });

    const submittedAssignments = await StudentAssignments.aggregate([
      {
        $match: {
          "studentId": studentId,
          "courses.courseId": courseId,
        },
      },
      {
        $project: {
          assignmentId: {
            $arrayElemAt: [
              "$courses.courseAssignments.assignmentId",
              0,
            ],
          },
        },
      },
    ]);

    const submittedAssignmentIds = 
      
        submittedAssignments
        .map((a) => a.assignmentId).map((id)=>id)
        if(submittedAssignmentIds[0]===undefined){
          return res.status(200).send({msg:"No Assignment Yet!"})
        }
      
    
    console.log(submittedAssignmentIds,"S")
    const now = new Date();

    const categorizedAssignments = assignments.reduce(
      (acc, assignment) => {
        // console.log(assignment._id.toString(),submittedAssignmentIds[0])
//     submittedAssignmentIds[0].map(
      
//         (id)=> {
// console.log(id,assignment._id.toString())

//           if(id=== assignment._id.toString()){
//           acc.submitted.push(assignment);
          
//         }
//         else if (now >= new Date(assignment.deadline)) {
//           acc.nonSubmitted.push(assignment);
//         }else {
//           acc.current.push(assignment);
//         }
       
//         }
        
//         );
if(submittedAssignmentIds[0]?.includes(assignment._id.toString())){
  acc.submitted.push(assignment);

}
else if (now >= new Date(assignment.deadline) ) {
  acc.nonSubmitted.push(assignment);

}else {
  acc.current.push(assignment);

}

        return acc;
      },
      { current: [], submitted: [], nonSubmitted: [] }
    );
    res.json(categorizedAssignments);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }

})



studentAssignmentsRouter.post("/submit", upload.any(), async (req, res) => {
  try {

    const fileNames = await AssignmentuploadFile(req.files)

    const newStudentAssignment = {
      assignmentId: req.body.assignmentId,
      studentAttachedLinks: req.body.studentAttachedLink,
      studentAttachedFileLinks: fileNames || null,
    }


    const studentAssignment = await StudentAssignments.findOneAndUpdate(
      { studentId: req.body.studentId, 'courses.courseId': req.body.courseId },
      {
        $push: { 'courses.$.courseAssignments': newStudentAssignment }
      },
      { new: true, useFindAndModify: false }
    )
    const course = studentAssignment.courses.find(course => course.courseId === req.body.courseId);
    //  if(!studentAssignment)
    const submittedAssignment = course.courseAssignments.find(
      (assignment) => assignment.assignmentId === req.body.assignmentId
    );
    //   res.send({"msg":"assignment was not created "})
    res.send({ submittedAssignment })

  }
  catch (e) {
    console.error('Error fetching assignment:', e);
    res.status(500).send({ error: 'Internal server error', e });
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
      $unwind: '$courses.courseAssignments' 
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

  res.status(200).send({ studentAssignment })
})

studentAssignmentsRouter.patch('/edit/:id', upload.any(), async (req, res) => {

  try {
    const id = req.params.id
    const fileNames = await AssignmentuploadFile(req.files)

    const existingStudentAssignment = {
      assignmentId: id,
      studentAttachedLinks: req.body.studentAttachedLink,
      studentAttachedFileLinks: fileNames || null,
    }

    const studentAssignment = await StudentAssignments.findOneAndUpdate(
      { studentId: req.body.studentId, 'courses.courseId': req.body.courseId, 'courses.courseAssignments.assignmentId': id },
      {
        $set: { 'courses.$[course].courseAssignments.$[elem]': existingStudentAssignment }
      },
      {
        arrayFilters: [
          { 'course.courseId': req.body.courseId, },
          { 'elem.assignmentId': id }
        ], new: true
      }

    )
    if (!studentAssignment)
      return res.status(404).send({ message: 'Assignment not found' })
    res.status(200).send({ studentAssignment })

  }
  catch (e) {
    res.send({ msg: "erroror updating document", err: e.message })
  }

})
studentAssignmentsRouter.delete('/del/:assignmentId', async (req, res) => {
  const assignmentId = req.params.assignmentId
  const studentId = req.body.studentId



  const studentAssignmentDelelte = await StudentAssignments.findOneAndUpdate({ studentId }, { $pull: { "assignments": { "assignmentId": assignmentId } } })


  if (studentAssignmentDelelte)
    res.status(200).send({ msg: "sucessfully deleted", studentAssignmentDelelte })
  res.status(404).send('not found')

})
studentAssignmentsRouter.post("/grade", async (req, res) => {
  const studentAssignments = await StudentAssignments.findOne({ studentId: req.body.studentId })
  if (studentAssignments)
    studentAssignments.courses.forEach(course => {
      course.courseAssignments?.forEach(element => {
        if (element.assignmentId == req.body.assignmentId) {
          console.log(element.assignmentId)
          element.grade = req.body.grade
        }
      });
    });
  await studentAssignments?.save()
  res.send({ studentAssignments })
})
export default studentAssignmentsRouter