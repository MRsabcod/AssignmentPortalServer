import express from 'express'
import cors from 'cors'
import router from '../Routes/index.js';
import {connectDB} from '../db/index.js';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser'
import path from 'path';
import { google } from 'googleapis';
import { Stream } from 'stream';
import { fileURLToPath } from 'url';
import multer from 'multer';
 const upload=multer()

// import credentials from './credentials.json'  assert {type:"json"}
dotenv.config();
const app=express()
app.use(cookieParser())
app.use(express.json())
app.use(cors({}));
app.use(express.urlencoded({ extended: false }))

connectDB()
.then(() => {

    app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    })
})
app.get('/', (req, res) => {
    res.send('Hello World!')
  })

app.use('/',router)
const serviceAccount = JSON?.parse(process.env.CRED);
var jwtClient = new google.auth.JWT(
    serviceAccount.client_email,
    null,
    serviceAccount.private_key,
    ['https://www.googleapis.com/auth/drive']
  );
  jwtClient.authorize(function (err, tokens) {
    if (err) {
      return;
    } else {
      console.log("Google autorization complete");
    }
  });
// console.log(jwtClient)

export async function uploadFile (fileObject){
    console.log(fileObject)
    const bufferStream=new Stream.PassThrough()
    bufferStream.end(fileObject.buffer)
    // console.log(bufferStream)
    const {data}=await google.drive({
        version: 'v3',
        auth:jwtClient
    }
    
).files.create({
    media:{
        mimeType:fileObject.mimetype,
        body:bufferStream
    },
    requestBody:{
        name:fileObject.originalname,
        parents:['1NgGBYwVYQgOL6mJAJFAVevISWPr_K0Pf']
    },
    fields:"id,name,webViewLink,webContentLink"
})
// console.log(data)

// console.log(`uploaded file ${data.name} ${data.id} ${data.webViewLink} ${data.webContentLink}  `)
return {webViewLink:data.webViewLink,webDownloadLink:data.webContentLink}
}
app.post('/upload',upload.any(),async(req,res)=>{
   try{ const {body,files}=req
//    console.log(files,body
//    )
let fileup;
    for (let f = 0; f < files.length; f++) {
     fileup=await uploadFile(files[f]);
    }
    // console.log(body)
    res.status(200).send({up:'uploaded',fileup})}
    catch(f){
        res.send(f.message)
    }
})

