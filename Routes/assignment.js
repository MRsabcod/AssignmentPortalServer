import express from "express";
import Assignment from "../Models/Assignment.js";
import StudentAssignments from "../Models/StudentAssignments.js";
import { uploads } from "../middlewares/assignment.js";
import { gfs } from "../db/index.js";
import mongoose from "mongoose";
import User from "../Models/User.js";
import multer from "multer";
import uploadFile from "../utils/googleDrive.js";

const assignmentRouter = express.Router();

const upload = multer()
const AssignmentuploadFile=async(files)=>{
  let fileNames=[];
    for (let f = 0; f < files.length; f++) {
     
      fileNames.push(await uploadFile(files[f]))
    }
    return fileNames
}
assignmentRouter.get("/:courseId", async (req, res) => {
  try {
    const { studentId } = req.body;
    const { courseId } = req.params;
    const assignments = await Assignment.find(
      { courseId },
      { _id: 1, title: 1, deadline: 1 }
    );
    let studentAssignments;
    if (studentId) {
      studentAssignments = await StudentAssignments.findOne(
        {
          studentId,
          courses: {
            $elemMatch: { courseId: courseId },
          },
        },
        {
          courses: 1,
          _id: 0,
        }
      );
    }
    const {courseAssignments} = studentAssignments.courses.find(course => course.courseId === courseId);
    const matchAssignments= assignments?.map((studAssignment)=>courseAssignments.find((assignment)=>{assignment.assignmentId!==studAssignment._id.toString()} ))
    res.json({ assignments, courseAssignments,matchAssignments });
  } catch (error) {
    console.error("Error fetching assignment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
assignmentRouter.patch('/edit/:id', upload.any(), async (req, res) => {
 
  try {

  const fileNames=await AssignmentuploadFile(req.files)

   
  const { title, deadline, desc } = req.body
  const assignemntUpdate = await Assignment.findByIdAndUpdate(req.params.id, { title, deadline, desc, teacherAttachedFileLinks: fileNames }, { new: true })
  if (!assignemntUpdate)
    res.status(404).json({ error: "Assignment not found" })
  res.json(assignemntUpdate)
}
  catch (error) {
    console.error("Error updating assignment:", error);
  }
})
assignmentRouter.post(
  "/upload",
  upload.any(),

  async (req, res) => {
    
    try{ 
      const {body,files}=req
    const { title, desc, courseId, deadline,maxMarks } = body;
    
    const fileNames=await AssignmentuploadFile(files)
    
    const assignment = await Assignment.create({
      title,
      desc,
      courseId,
      deadline,
      teacherAttachedFileLinks: fileNames,
      maxMarks,
    });
    const createdAssignment = await Assignment.findById(assignment._id).select(
      "-courseId"
    );
    if (!createdAssignment)
      return res.status(400).send({ error: "Something went wrong" });
    return res.status(200).send({ assignment: createdAssignment });
  } catch (f) {
    res.send(f.message);
  }
});

assignmentRouter.get("/assignment/:id", async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
   

    res.json({ assignment });
  } catch (error) {
    console.error("Error fetching assignment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

assignmentRouter.delete("/del/:id", async (req, res) => {
  const assignemnt = await Assignment.findById(req.params.id);
  if (assignemnt)
  {
  const assignmentDelete = await Assignment.findByIdAndDelete(req.params.id);
  if (!assignmentDelete)
    res.status(404).send({ msg: "assignment not found", assignemnt })
  else
    res.status(200).send({ msg: "deleted successfully", assignemnt })
}});
assignmentRouter.get("/:assignmentId/students", async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }
    const students = await User.aggregate([
      { $match: { "courses.ID": courseId } },
      {
        $project: {
          _id: 1,
          fullName: 1,
          courses: {
            $filter: {
              input: "$courses",
              as: "course",
              cond: { $eq: ["$$course.ID", courseId] },
            },
          },
        },
      },
    ]);

    const unactiveStudents = students.filter(
      (student) => student.courses[0].active === false
    );
    const activeStudents = students.filter(
      (student) => student.courses[0].active === true
    );

    const submittedStudents = await StudentAssignments.aggregate([
      {
        $match: {
          "courses.courseId": courseId,
        },
      },
      {
        $project: {
          studentId: 1,
          studentName: 1,
          courses: {
            $filter: {
              input: "$courses",
              as: "course",
              cond: {
                $eq: ["$$course.courseId", courseId],
              },
            },
          },
        },
      },
      {
        $project: {
          studentId: 1,
          studentName: 1,
          courseAssignments: {
            $filter: {
              input: { $arrayElemAt: ["$courses.courseAssignments", 0] },
              as: "assignment",
              cond: {
                $eq: ["$$assignment.assignmentId", assignmentId],
              },
            },
          },
        },
      },
      {
        $project: {
          studentId: 1,
          studentName: 1,
          assignmentId: {
            $arrayElemAt: ["$courseAssignments.assignmentId", 0],
          },
        },
      },
    ]);

    const submittedStudentMap = new Map(
      submittedStudents.map((student) => [student.studentId, student])
    );
    console.log(submittedStudentMap)
    const now = new Date()
    const { submitted, nonSubmitted } = activeStudents.reduce(
      (acc, student) => {
        const studentId = student._id.toHexString();
        console.log(studentId)
        if (submittedStudentMap.has(studentId) ) {
          const submittedStudent = submittedStudentMap.get(studentId);
          acc.submitted.push({
            studentId: studentId,
            studentName: student.fullName,
            courses: student.courses,
            assignments: submittedStudent.assignmentId,
          });
        }
        
         else {
            acc.nonSubmitted.push(student);
          }
        
        return acc;
      },
      { submitted: [], nonSubmitted: [] }
    );

    res.json({ unactiveStudents, submitted, nonSubmitted });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

assignmentRouter.patch("/:assignmentId/toggle-starred", async (req, res) => {
  const { studentId, courseId } = req.body;
  const { assignmentId } = req.params;

  try {
    const studentAssignment = await StudentAssignments.findOneAndUpdate(
      {
        studentId: studentId,
        "courses.courseId": courseId,
        "courses.courseAssignments.assignmentId": assignmentId,
      },
      [
        {
          $set: {
            "courses.courseAssignments.$.starred": {
              $not: "$courses.courseAssignments.starred",
            },
          },
        },
      ],
      { new: true }
    );

    if (!studentAssignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.json({
      message: "Starred status toggled successfully",
      studentAssignment,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

assignmentRouter.get("/starred/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;
    const condition = true;
    const starredAssignments = await StudentAssignments.aggregate([
      {
        $match: {
          "courses.courseId": courseId,
        },
      },
      {
        $project: {
          studentId: 1,
          studentName: 1,
          courses: {
            $filter: {
              input: "$courses",
              as: "course",
              cond: {
                $eq: ["$$course.courseId", courseId],
              },
            },
          },
        },
      },
      {
        $project: {
          studentId: 1,
          studentName: 1,
          courseAssignments: {
            $filter: {
              input: {
                $arrayElemAt: ["$courses.courseAssignments", 0],
              },
              as: "assignment",
              cond: {
                $eq: ["$$assignment.starred", condition],
              },
            },
          },
        },
      },
      {
        $project: {
          studentId: 1,
          studentName: 1,
          assignmentId: {
            $arrayElemAt: ["$courseAssignments.assignmentId", 0],
          },
        },
      },
    ]);
    res.json(starredAssignments);
  } catch (error) {
    console.error(error);
  }
});

export default assignmentRouter;
