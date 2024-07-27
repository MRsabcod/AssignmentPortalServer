import express from "express";
import Assignment from "../Models/Assignment.js";
import Users from "../Models/User.js";
import StudentAssignments from "../Models/StudentAssignments.js";
import fs, { ReadStream } from "fs";
import apikeys from "../utils/apikey.json";
import { google } from "googleapis";
import { uploads } from "../middlewares/assignment.js";
import { gfs } from "../db/index.js";
import mongoose from "mongoose";
const assignmentRouter = express.Router();

/**
 * Insert new file.
const fs = require('fs');
const {GoogleAuth} = require('google-auth-library');
const {google} = require('googleapis');
 * @return{obj} file Id
 * */

async function authorize() {
  const jwtClient = new google.auth.JWT(
    apikeys.client_email,

    null,
    apikeys.private_key,
    SCOPE
  );
}

async function uploadBasic() {
  // Get credentials and build service
  // TODO (developer) - Use appropriate auth mechanism for your app

  const service = google.drive({
    version: "v3",
    auth: "43be80cc078b7efa27eb70f399430ca5a0ba7f7a",
  });
  const requestBody = {
    name: "photo.jpg",
    fields: "id",
  };
  const media = {
    mimeType: "image/jpeg",
    body: fs.createReadStream("files/photo.jpg"),
  };
  try {
    const file = await service.files.create({
      requestBody,
      media: media,
    });
    console.log("File Id:", file.data.id);
    return file.data.id;
  } catch (err) {
    // TODO(developer) - Handle error
    throw err;
  }
}

assignmentRouter.get("/", async (req, res) => {
  try {
    const assignments = await Assignment.find();
    let allAssignments = [];
    let file = null;
    let base64String = [];
    // let allAssignments = {};
    await Promise.all(
      assignments.map(async (doc) => {
        if (
          doc.teacherAttachedFileIds &&
          doc.teacherAttachedFileIds.length > 0
        ) {
          // Create an array of promises
          const filePromises = doc.teacherAttachedFileIds.map(
            async (fileId) => {
              const files = await gfs
                .find({ _id: new mongoose.Types.ObjectId(fileId) })
                .toArray();
              if (files && files.length > 0) {
                const fileToStream = gfs.openDownloadStreamByName(
                  files[0].filename
                );
                const chunks = [];

                fileToStream.on("data", (chunk) => {
                  chunks.push(chunk);
                });

                return new Promise((resolve, reject) => {
                  fileToStream.on("end", () => {
                    const fileBuffer = Buffer.concat(chunks);
                    const base64Data = fileBuffer.toString("base64");
                    resolve(base64Data);
                  });
                  fileToStream.on("error", (err) => {
                    reject(err);
                  });
                });
              }
            }
          );

          // Wait for all promises to resolve
          base64String = await Promise.all(filePromises);
        }
        allAssignments.push({ base64String, doc });
      })
    );

    res.json({ allAssignments });
  } catch (error) {
    console.error("Error fetching assignment:", error);
    res.status(500).json({ error: "Internal server error" });
  }

  // res.pipe(assignments)
});

assignmentRouter.post(
  "/upload",
  uploads.array("files", 5),
  async (req, res) => {
    const fileNames = req.files
      .filter((file) => file.size <= 1000)
      .map((file) => file.id);
    const { title, desc, courseId, deadline } = req.body;
    console.log(fileNames);
    if (fileNames?.length) {
      const assignment = await Assignment.create({
        title,
        desc,
        courseId,
        deadline,
        teacherAttachedFileIds: fileNames,
      });
      const createdAssignment = await Assignment.findById(
        assignment._id
      ).select("-courseId");
      if (!createdAssignment)
        return res.status(400).send({ error: "Something went wrong" });
      return res.status(200).send({ assignment: createdAssignment });
    }
  }
);

assignmentRouter.get("/assignment/:id", async (req, res) => {
  // const assignemnt=await Assignment.findById(req.params.id)
  // const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
  // const __dirname = path.dirname(__filename);
  // let StreamToText;
  // let base64String=[];
  // let fileToStream;

  //  assignemnt.teacherAttachedFileIds?.map(async(fileId)=>{
  //     const file = await gfs.find({_id:new mongoose.Types.ObjectId(fileId)}).toArray()
  //    if(file){
  //  fileToStream=await gfs.openDownloadStreamByName(file[0]?.filename).toArray()
  //  StreamToText=await fileToStream.toString('base64')

  // // fs.writeFile(`${file[0].filename}`, fileToStream[0], (err) => {

  // //   // In case of a error throw err.
  // //   if (err) res.send(err)
  // //     else {
  // // console.log(fs.readFileSync(`${file[0].filename}`, "utf8"));

  // //     }
  // // })
  //    }
  //    base64String.push(  btoa(
  //     String.fromCharCode(...new Uint8Array(fileToStream[0]))
  //   ));

  //   console.log(base64String)
  // })

  //  res.json({ base64String,assignemnt})

  try {
    const assignment = await Assignment.findById(req.params.id);

    let base64String = [];

    if (
      assignment.teacherAttachedFileIds &&
      assignment.teacherAttachedFileIds.length > 0
    ) {
      // Create an array of promises
      const filePromises = assignment.teacherAttachedFileIds.map(
        async (fileId) => {
          const files = await gfs
            .find({ _id: new mongoose.Types.ObjectId(fileId) })
            .toArray();
          if (files && files.length > 0) {
            const fileToStream = gfs.openDownloadStreamByName(
              files[0].filename
            );
            const chunks = [];

            fileToStream.on("data", (chunk) => {
              chunks.push(chunk);
            });

            return new Promise((resolve, reject) => {
              fileToStream.on("end", () => {
                const fileBuffer = Buffer.concat(chunks);
                const base64Data = fileBuffer.toString("base64");
                resolve(base64Data);
              });
              fileToStream.on("error", (err) => {
                reject(err);
              });
            });
          }
        }
      );

      // Wait for all promises to resolve
      base64String = await Promise.all(filePromises);
    }

    res.json({ base64String, assignment });
  } catch (error) {
    console.error("Error fetching assignment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

assignmentRouter.post("/del/:id", async (req, res) => {
  const assignemnt = await Assignment.findById(req.params.id);

  gfs.delete(
    new mongoose.Types.ObjectId(assignemnt.teacherAttachedFile),
    (err, data) => {
      if (err) return res.status(404).json({ err: err.message });
      res.redirect("/");
    }
  );
  await Assignment.findByIdAndDelete(req.params.id);
});

assignmentRouter.get("/:assignmentId/students", async (req, res) => {
  try {
    const { assignmentId } = req.params.assignmentId;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const courseId = req.body.courseId;
    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }
    const students = await Users.aggregate([
      { $match: { "courses.id": courseId } },
      {
        $project: {
          _id: 1,
          fullName: 1,
          courses: {
            $filter: {
              input: "$courses",
              as: "course",
              cond: { $eq: ["$$course.id", courseId] },
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
          "assignments.assignmentId": assignmentId,
        },
      },
      {
        $project: {
          studentId: 1,
          studentName: 1,
          assignments: {
            $filter: {
              input: "$assignments",
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
          assignments: {
            courseId: 1,
            assignmentId: 1,
            grade: 1,
          },
        },
      },
    ]);

    const submittedStudentMap = new Map(submittedStudents.map(student => [student.studentId, student]));
    const { submitted, nonSubmitted } = activeStudents.reduce((acc, student) => {
      const studentId = student._id;
      if (submittedStudentMap.has(studentId)) {
        const submittedStudent = submittedStudentMap.get(studentId);
        acc.submitted.push({
          studentId: studentId,
          studentName: student.fullName,
          courses: student.courses,
          assignments: submittedStudent.assignments
        });
      } else {
        acc.nonSubmitted.push(student);
      }
      return acc;
    }, { submitted: [], nonSubmitted: [] });

    res.json({ unactiveStudents, submitted, nonSubmitted });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

assignmentRouter.patch("/:assignmentId/toggle-starred", async (req, res) => {
  const assignmentId = req.params.assignmentId;
  const studentId = req.body.studentId;

  try {
    const studentAssignment = await StudentAssignments.findOneAndUpdate(
      {
        studentId: studentId,
        "assignments.assignmentId": assignmentId,
      },
      [
        {
          $set: {
            "assignments.$.starred": { $not: "$assignments.starred" },
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

export default assignmentRouter;

