import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import verifyToken from "../middlewares/user.js";
import Teacher from "../Models/Teacher.js";
import User from "../Models/User.js";
import Course from "../Models/Course.js";

const teacherRouter = express.Router();

const generateToken = async (cnic) => {
  try {
    const teacher = await Teacher.findOne({ cnic });
    console.log(teacher);
    const token = jwt.sign(
      {
        cnic: teacher.cnic,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
      }
    );
    teacher.refreshToken = token;
    await teacher.save({ validateBeforeSave: false });
    return token;
  } catch (error) {
    console.log(error);
  }
};

teacherRouter.post("/register", async (req, res) => {
  const { email, fullName, cnic, contact, courses } = req.body;
  const password = Math.random(9);
  const existedTeacher = await Teacher.findOne({
    $or: [{ cnic }, { email }],
  });
  if (existedTeacher) {
    res.status(400).send({ error: "Username or email already exists" });
  }
  const teacher = await Teacher.create({
    fullName,
    cnic,
    password,
    email,
    contact,
    courses,
  });
  const createdTeacher = await Teacher.findById(teacher._id).select(
    "-password -refreshToken"
  );
  if (!createdTeacher) return res.send({ error: "teacher not created" });
  res.status(200).send({ createdTeacher, message: "REGISTER SUCCESSFULLY" });
});

teacherRouter.post("/login", async (req, res) => {
  const { password, cnic } = req.body;
  if (!cnic) {
    return res.status(400).send({ error: "cnic is required" });
  }
  const teacher = await Teacher.findOne({ cnic });
  if (!teacher) return res.status(400).send({ error: "not registered" });
  const isMatch = await bcrypt.compare(password, teacher.password);
  if (!isMatch) return res.status(400).send({ error: "password is incorrect" });
  const token = await generateToken(teacher.cnic);
  console.log(token);
const coursesDetails=await Promise.all(teacher.courses.map(async(course)=>{return await Course.findById(course.ID)}))

  res.send({ teacher, token , coursesDetails});
});

teacherRouter.post("/createPassword", async (req, res) => {
  const { cnic, password } = req.body;
  const teacher = await Teacher.findOne({ cnic });
  if (!teacher) {
    return res
      .status(400)
      .send({ error: "Teacher with this cnic doesnt exists" });
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  teacher.password = hashedPassword;
  await teacher.save();
  res.status(200).send({ msg: "password created successfully" });
});

teacherRouter.post("/updatePassword", async (req, res) => {
  const { oldPassword, newPassword, _id } = req.body;
  if (!oldPassword || !newPassword)
    return res
      .status(400)
      .send({ error: "old password and new password are required" });
  const teacher = await Teacher.findById(_id);
  const isMatch = await bcrypt.compare(oldPassword, teacher.password);
  if (!isMatch)
    return res.status(400).send({ error: "old password is incorrect" });
  teacher.password = await bcrypt.hash(newPassword, 12);
  await teacher.save();
  res.status(200).send({ msg: "password updated successfully" });
});

teacherRouter.get("/", async (req, res) => {
  const teachers = await Teacher.find();
  return res.status(200).send(teachers);
});

teacherRouter.patch("/:courseId/toggle-active", async (req, res) => {
  const courseId = req.params.courseId;
  const studentId = req.body.studentId;
  try {
    const user = await User.findById(studentId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const course = user.courses.find((course) => course.ID === courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    course.active = !course.active;
    await user.save();

    res.status(200).json({ message: "Course active status toggled", course });
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error });
  }
});

export default teacherRouter;
