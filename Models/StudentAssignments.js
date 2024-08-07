import mongoose, { Schema } from "mongoose";

const studentAssignemntSchema = new Schema({
  studentId: {
    type: String,
  },
  studentName: {
    type: String,
  },
  courses: [
    {
      courseId: {
        type: String,
      },
      totalPercentage: {
        type: Number,
        default: 0,
      },
      courseAssignments: [
        {
          assignmentId: {
            type: String,
          },
          starred: {
            type: Boolean,
            default: false,
          },
          studentAttachedLinks: {
            type: String,
          },

          studentAttachedFileLinks: [{}],
          grade: {
            type: Number,
            default: -1,
          },
        },
      ],
    },
  ],
});
const StudentAssignments = mongoose.model(
  "StudentsAssignments",
  studentAssignemntSchema
);
export default StudentAssignments;
