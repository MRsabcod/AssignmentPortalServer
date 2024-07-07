import express from 'express'
import Assignment from '../Models/Assignment.js'
import { uploads } from '../middlewares/assignment.js'
import {gfs} from '../db/index.js'
import mongoose from 'mongoose'
const assignmentRouter=express.Router()
assignmentRouter.get('/',async(req,res)=>{
    const assignments=await Assignment.find()
    res.send({data:assignments,message:"FETCH SUCCESSFULLY"})
})
assignmentRouter.post('/upload',uploads.single('file'),async(req,res)=>{
const {title,desc,courseId}=req.body
const assignment=await Assignment.create({
    title,
    desc,
    courseId,
    teacherAttachedFile:req.file.id
})
const createdAssignment=await  Assignment.findById(assignment._id).select('-courseId')
if(!createdAssignment)
    return res.status(400).send({error:'Something went wrong' })
return res.status(200).send({assignment:createdAssignment})
})
assignmentRouter.get('/assignment/:id',async(req,res)=>{
    // console.log(gfs.files)
    // let readstream
    // gfs.files.findOne({ _id:new  mongoose.Types.ObjectId(req.params.id) }, (err, file) => {
        
    //     if (!file || file.length === 0) {
            
    //         return res.status(404).json({ err: 'No file exists' });
    //     }
    //      readstream = gfs.createReadStream(file.filename);
    //     readstream.pipe(res);
    // });
   
    // const fies= await gfs.files.findOne({_id:new mongoose.Types.ObjectId(req.params.id)})
    // if(fies){
    //        const readstream = gfs.createReadStream({
    //         _id: req.params.id
    //      })
    //     readstream.pipe(res)
    // console.log(readstream)
    // readstream.on('data', (chunk) => {
    //     console.log(chunk); // Log each data chunk
    // });
    // }
    //     return res.status(200).send({file:fies})
    // return res.status(400).send({error:'Something went wrong' })
    const file = gfs
    .find({
      filename: req.params.filename
    })
    .toArray((err, files) => {
      if (!files || files.length === 0) {
        return res.status(404).json({
          err: "no files exist"
        });
      }
      const file=gfs.openDownloadStreamByName(req.params.filename).pipe(res);
      console.log(file)
    });
})
export default assignmentRouter