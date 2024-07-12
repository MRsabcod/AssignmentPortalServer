import express from 'express'
import Assignment from '../Models/Assignment.js'
import fs from 'fs'
import path from 'path'
import {
  fileURLToPath
} from 'url'
import { uploads } from '../middlewares/assignment.js'
import {gfs} from '../db/index.js'
import mongoose from 'mongoose'
const assignmentRouter=express.Router()
assignmentRouter.get('/',async(req,res)=>{
  const assignments=await Assignment.find()
  let allAssignments=[]
  let file=null;
    assignments.map(async(doc)=>{
      // console.log(doc,allAssignments)
       file = await gfs.find({_id:new mongoose.Types.ObjectId(doc?.teacherAttachedFileId)}).toArray()   
      const fileToStream= await gfs.openDownloadStreamByName( file[0]?.filename).toArray()
    
      const StreamToText=  fileToStream.toString('base64')
      doc.teacherAttachedFile.push(StreamToText) 
      await doc.save()

      
      
  //   // In case of as error throw err.
//   if (err) res.send(err)
// })
// console.log(fs.readFileSync(`${file[0].filename}`, "utf8"));
// allAssignments.push({doc,teachersFile:StreamToText})

})

res.send({assignments})

// res.pipe(assignments)

})
assignmentRouter.post('/upload',uploads.single('file'),async(req,res)=>{
const {title,desc,courseId}=req.body
const assignment=await Assignment.create({
    title,
    desc,
    courseId,
    teacherAttachedFileId:req.file.id
})
const createdAssignment=await  Assignment.findById(assignment._id).select('-courseId')
if(!createdAssignment)
    return res.status(400).send({error:'Something went wrong' })
return res.status(200).send({assignment:createdAssignment})
})


assignmentRouter.get('/assignment/:id',async(req,res)=>{
const assignemnt=await Assignment.findById(req.params.id)
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename);
let StreamToText;
let fileToStream;
console.log(__dirname)
    const file = await gfs.find({_id:new mongoose.Types.ObjectId(assignemnt?.teacherAttachedFileId)}).toArray()
   if(file){
 fileToStream=await gfs.openDownloadStreamByName(file[0]?.filename).toArray()
 StreamToText=await fileToStream.toString('base64')

console.log(fileToStream[0])
// fs.writeFile(`${file[0].filename}`, fileToStream[0], (err) => {

//   // In case of a error throw err.
//   if (err) res.send(err)
//     else {
// console.log(fs.readFileSync(`${file[0].filename}`, "utf8"));
  
//     }
// })
   }
   const base64String = btoa(
    String.fromCharCode(...new Uint8Array(fileToStream[0]))
  );
  console.log(base64String)
  
   res.send(base64String)
 
   
})
assignmentRouter.post("/del/:id", async(req, res) => {
  const assignemnt=await Assignment.findById(req.params.id)

  gfs.delete(new mongoose.Types.ObjectId(assignemnt.teacherAttachedFile), (err, data) => {
    if (err) return res.status(404).json({ err: err.message });
    res.redirect("/");
  });
  await Assignment.findByIdAndDelete(req.params.id)
});
export default assignmentRouter