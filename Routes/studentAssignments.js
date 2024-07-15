import express from 'express'
import StudentAssignments from '../Models/StudentAssignments.js'
import { upload } from '../middlewares/multer.js'
import mongoose from 'mongoose'
import { uploads } from '../middlewares/assignment.js'
import {gfs} from '../db/index.js'
const b64toBlob = (b64Data, contentType='', sliceSize=512) => {
   const byteCharacters = atob(b64Data);
   const byteArrays = [];
 
   for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
     const slice = byteCharacters.slice(offset, offset + sliceSize);
 
     const byteNumbers = new Array(slice.length);
     for (let i = 0; i < slice.length; i++) {
       byteNumbers[i] = slice.charCodeAt(i);
     }
 
     const byteArray = new Uint8Array(byteNumbers);
     byteArrays.push(byteArray);
   }
     
   const blob = new Blob(byteArrays, {type: contentType});
   // console.log("blobit",blob)
   return blob;
 }
const studentAssignmentsRouter=express.Router()
studentAssignmentsRouter.get("/",async(req,res)=>{
    const studentAssignments=await StudentAssignments.find()
    res.send(studentAssignments)

})
studentAssignmentsRouter.post("/submit",uploads.single('file'),async(req,res)=>{
    const studentAssignments=await StudentAssignments.findOne({studentId:req.body.studentId})
 if(studentAssignments)
    await studentAssignments.assignments.push({
    assignmentId:req.body.assignmentId,
    studentAttachedLink:req.body.studentAttachedLink||null,
    studentAttachedFileId:req.file.id||null,

   })
   const file = await gfs.find({_id:new mongoose.Types.ObjectId(req.file.id)}).toArray()
   // console.log(file[0])
   const fileToStream=await gfs.openDownloadStreamByName(file[0]?.filename).toArray()
//    const StreamToText=await fileToStream.toString('base64')
   const base64String = btoa(
    String.fromCharCode(...new Uint8Array(fileToStream[0]))
  );
   const blob=b64toBlob( base64String,await file[0].contentType)
   const blobUrl = URL.createObjectURL(blob);
   console.log(blobUrl)
   await studentAssignments.assignments.push({
    // studentAttachedFileContentType:file[0].con
    studentAttachedFile:base64String||null

   }) 
   res.send(blobUrl)
})
export default studentAssignmentsRouter