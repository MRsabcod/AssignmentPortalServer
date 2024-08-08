import express from "express";
import Course from "../Models/Course.js";
import StudentAssignments from "../Models/StudentAssignments.js";
const courseRouter = express.Router();

courseRouter.get("/:id", async (req, res) => {
  const courses = await Course.findById(req.params.id);
  res.send({ courses });
});

courseRouter.get("/leaderboard/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;
    const list = await StudentAssignments.find({
      "courses.courseId": courseId,
    }).select({ studentId: 1, studentName: 1, courses: 1 });

    const leaderboard = list.map((stud) => {
      return {
        studentId: stud.studentId,
        studentName: stud.studentName,
        totalPercentage: stud.courses[0].totalPercentage,
      };
    });
    res.json(leaderboard);
  } catch (error) {
    console.error(error);
  }
});
export default courseRouter;
