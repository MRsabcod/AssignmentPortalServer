import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    days: {
      type: [],
    },
    timings: {
      type: String,
      required: true,
    },
    teacherId:{
      type: String,
    }
  },
  {
    timeStamps: true,
  }
);
const Course = mongoose.model("Course", courseSchema);
export default Course;