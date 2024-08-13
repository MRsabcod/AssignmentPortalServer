import express from "express";
import Course from "../Models/Course.js";
import StudentAssignments from "../Models/StudentAssignments.js";
import Assignment from "../Models/Assignment.js";
const courseRouter = express.Router();

courseRouter.get("/:id", async (req, res) => {
  const courses = await Course.findById(req.params.id);
  res.send({ courses });
});
courseRouter.post('/assignTotalPercentage',async(req,res)=>{
  try {
    // Find all students' assignments
    const allStudentAssignments = await StudentAssignments.find();

    // Loop through each student
    for (let studentAssignments of allStudentAssignments) {
        // Initialize total values
        let totalMaxMarks = 0;
        let totalGrades = 0;

        // Loop through each course in student's assignments
        for (let course of studentAssignments.courses) {
            for (let assignment of course.courseAssignments) {
                // Find the assignment's max marks using the assignmentId
                const assignmentData = await Assignment.findById(assignment.assignmentId);

                if (assignmentData) {
                    totalMaxMarks += assignmentData.maxMarks;
                    totalGrades += assignment.grade > 0 ? assignment.grade : 0; // only add positive grades
                }
            }

            // Calculate the total percentage for this course
            course.totalPercentage = (totalGrades / totalMaxMarks) * 100;
        }

        // Save the updated student assignments
        await studentAssignments.save();
    }
    console.log("Total percentage calculated and updated for all students.");
res.send("Total percentage calculated and updated for all students.")
  } catch (error) {
    console.error("Error calculating total percentage for all students: ", error);
}
})
courseRouter.get("/leaderboard/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;
    const list = await StudentAssignments.find({
      "courses.courseId": courseId,
    }).sort('coruses.totalPercentage').select({ studentId: 1, studentName: 1, courses: 1 });

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
