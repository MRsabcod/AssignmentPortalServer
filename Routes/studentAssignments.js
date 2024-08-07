import express from "express";
import StudentAssignments from "../Models/StudentAssignments.js";
import upload from "../middlewares/multer.js";
import mongoose from "mongoose";
import { uploads } from "../middlewares/assignment.js";
import { gfs } from "../db/index.js";
import uploadFile from "../utils/googleDrive.js";

const studentAssignmentsRouter = express.Router();

studentAssignmentsRouter.get("/", async (req, res) => {
  const studentAssignments = await StudentAssignments.find();
  res.send(studentAssignments);
});

studentAssignmentsRouter.get("/:id", async (req, res) => {
  const studentId = req.params.id;
  const { courseId } = req.body;

  const studentAssignments = await StudentAssignments.findOne({
    studentId: studentId,
    "courses.courseId": courseId,
  }).select("-studentId -_id -__v");
  res.status(200).send(studentAssignments);
});

studentAssignmentsRouter.post("/submit", upload.any(), async (req, res) => {
  try {
    const { courseId } = req.body;
    const { files } = req;
    let fileNames = [];
    for (let f = 0; f < files.length; f++) {
      fileNames.push(await uploadFile(files[f]));
    }
    const newStudentAssignment = {
      assignmentId: req.body.assignmentId,
      studentAttachedLinks: req.body.studentAttachedLink,
      studentAttachedFileLinks: fileNames || null,
    };
    const s = await StudentAssignments.findOne({
      "courses.courseId": courseId,
      "courses.courseAssignments.assignmentId":
        newStudentAssignment.assignmentId,
    });

    const studentAssignment = await StudentAssignments.findOneAndUpdate(
      {
        studentId: req.body.studentId,
        "courses.courseId": req.body.courseId,
        "courses.courseAssignments.assignmentId":
          newStudentAssignment.assignmentId,
      },
      {
        $set: {
          "courses.$[course].courseAssignments.$[elem]": newStudentAssignment,
        },
      },
      {
        arrayFilters: [
          { "course.courseId": req.body.courseId },
          { "elem.assignmentId": newStudentAssignment.assignmentId },
        ],
      }
    );
    res.send({ studentAssignment });
  } catch (e) {
    console.error("Error fetching assignment:", e);
    res.status(500).send({ error: "Internal server error" });
  }
});

studentAssignmentsRouter.get(
  "/studentAssignment/:studentId",
  async (req, res) => {
    const studentId = req.params.studentId;
    const { courseId, assignmentId } = req.body;

    const studentAssignment = await StudentAssignments.aggregate([
      {
        $match: { studentId: studentId },
      },
      {
        $project: {
          _id: 1,
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
          _id: 1,
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
          _id: 1,
          assignment: {
            $arrayElemAt: ["$courseAssignments", 0],
          },
        },
      },
    ]);
    res.status(200).send({ studentAssignment });
  }
);

studentAssignmentsRouter.patch("/edit/:id", async (req, res) => {
  const id = req.params.id;
});

studentAssignmentsRouter.delete("/del/:assignmentId", async (req, res) => {
  const assignmentId = req.params.assignmentId;
  const studentId = req.body.studentId;
  const studentAssignment = await StudentAssignments.findOne(
    { studentId },
    { assignments: { $elemMatch: { assignmentId } } }
  );
  const studentAssignmentIds =
    studentAssignment.assignments[0].studentAttachedFileIds;

  if (assignmentId && studentId) {
    await StudentAssignments.findOneAndUpdate(
      { studentId },
      { $pull: { assignments: { assignmentId: assignmentId } } }
    );
    studentAssignmentIds.map((id) => {
      gfs.delete(new mongoose.Types.ObjectId(id), (err, data) => {
        if (err) return res.status(404).json({ err: err.message });
        console.log(data);
      });
    });
  }

  res.status(200).send({ msg: "sucessfully deleted", studentAssignment });
});

studentAssignmentsRouter.patch("/grade", async (req, res) => {
  try {
    const { studentId, courseId, assignmentId, grade } = req.body;
    const studentAssignments = await StudentAssignments.findOneAndUpdate(
      {
        studentId: studentId,
        "courses.courseId": courseId,
        "courses.courseAssignments.assignmentId": assignmentId,
      },
      {
        $set: {
          "courses.$[course].courseAssignments.$[assignment].grade": grade,
        },
      },
      {
        arrayFilters: [
          { "course.courseId": courseId },
          { "assignment.assignmentId": assignmentId },
        ],
        new: true,
      }
    );

    res.send({ studentAssignments });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating grade");
  }
});


export default studentAssignmentsRouter;
