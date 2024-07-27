import express from 'express'
import Assignment from '../Models/Assignment.js'
import fs, { ReadStream } from 'fs'
import apikeys   from '../utils/apikey.json' assert { type: "json" };
import credentialsjson   from '../utils/credentials.json' assert { type: "json" };
import {google} from 'googleapis'
import {GoogleAuth} from 'google-auth-library'
import { uploads } from '../middlewares/assignment.js'
import { gfs } from '../db/index.js'
import mongoose from 'mongoose'
import { upload } from '../middlewares/multer.js';
import path from 'path';
import { fileURLToPath } from 'url';
const assignmentRouter = express.Router()
/**
 * Insert new file.
const fs = require('fs');
const {GoogleAuth} = require('google-auth-library');
const {google} = require('googleapis');
 * @return{obj} file Id
 * */
const scopes = ['https://www.googleapis.com/auth/drive'];
// async function authorize(){
//   const jwtClient=new google.auth.JWT(
//     apikeys.client_email,
    
//     null,apikeys.private_key,
//     SCOPE
//   )
//   await jwtClient.authorize();
//   return jwtClient;
// }
// async function uploadBasic(authClient) {

//   // Get credentials and build service
//   // TODO (developer) - Use appropriate auth mechanism for your app
 
  
//   return new Promise((resolve,rejected)=>{
//     const drive = google.drive({version:'v3',auth:authClient}); 
//     var fileMetaData = {
//         name:'7d8ec661c968d79612600ef022bb296d.js',    
//         parents:['1Q09niCuzWb6nsrs-U_Tx6h2SFbQRcEFb'] // A folder ID to which file will get uploaded
//     }
//     drive.files.create({
//         resource:fileMetaData,
//         media:{
//             body: fs.createReadStream('7d8ec661c968d79612600ef022bb296d.js'), // files that will get uploaded
//             mimeType:'application/javascript'
//         },
//         fields:'id'
//     },function(error,file){
//         if(error){
//             return rejected(error)
//         }
//         resolve(file);
//     })
// });
// }
// authorize().then(uploadBasic).catch("error",console.error());
/**
 * Insert new file.
 * @return{obj} file Id
 * */
const oauth2Client = new google.auth.OAuth2(credentialsjson.web.client_id, credentialsjson.web.client_secret, 'http://localhost:3001/assignments/auth/google/');

const authUrl = oauth2Client.generateAuthUrl({
  // 'online' (default) or 'offline' (gets refresh_token)
  access_type: 'offline',
  /** Pass in the scopes array defined above.
  * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
  scope: scopes,
  // Enable incremental authorization. Recommended as a best practice.
  include_granted_scopes: true
});
oauth2Client.setCredentials({
  refresh_token: "1//03ZZe-FQYeVLRCgYIARAAGAMSNwF-L9IrwEm6JjtsgBc-KxZmm7u60GZ3NJgJ2vJ5DQOMltbx9fGe-FqDJu6dysiQioTXbhgHgq8",
access_token:"ya29.a0AXooCgukedqloNBLAc5ajJBqui0uHegYScwe6jsfPNOsKZeLKRp8J5DT52bitKoTCMH0-WemDsEgxi4C7XTzY9aaHtJTiZFN7_HJfSKrZ2COXaoNI-Vlt5lyStjtWOOsvNB7DnHmnt0RcSIU2iB46Zu9fttswJ833tNOaCgYKAbASARASFQHGX2Mi5wt2uze57CiPI3itu5msAw0171"
});
// async function uploadBasic(authClient) {


//   // Get credentials and build service
//   // TODO (developer) - Use appropriate auth mechanism for your app
//   const auth = new GoogleAuth({
//     scopes: 'https://www.googleapis.com/auth/drive',
//   });
//   const service = google.drive({version: 'v3', auth:oAuth2Client});
//   const requestBody = {
//     name: '7d8ec661c968d79612600ef022bb296d.js',
//     fields: 'id',
//   };
//   const media = {
//     mimeType: 'application/javascript',
//     body: fs.createReadStream('7d8ec661c968d79612600ef022bb296d.js'),
//   };
//   try {
//     const file = await service.files.create({
//       requestBody,
//       media: media,
//     });
//     console.log('File Id:', file.data.id);
//     return file.data.id;
//   } catch (err) {
//     // TODO(developer) - Handle error
//     throw err;
//   }
// }
// uploadBasic()
var drive = google.drive({
  version: "v3",
  auth: oauth2Client,
});
assignmentRouter.get('/auth/google', (req, res) => {
  res.send(authUrl);
});
assignmentRouter.get('/auth/google/callback', async (req, res) => {
 

  try {
    
    // Exchange the authorization code for access and refresh tokens
    // const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials({
      refresh_token: "1//03ZZe-FQYeVLRCgYIARAAGAMSNwF-L9IrwEm6JjtsgBc-KxZmm7u60GZ3NJgJ2vJ5DQOMltbx9fGe-FqDJu6dysiQioTXbhgHgq8",
    access_token:"ya29.a0AXooCgukedqloNBLAc5ajJBqui0uHegYScwe6jsfPNOsKZeLKRp8J5DT52bitKoTCMH0-WemDsEgxi4C7XTzY9aaHtJTiZFN7_HJfSKrZ2COXaoNI-Vlt5lyStjtWOOsvNB7DnHmnt0RcSIU2iB46Zu9fttswJ833tNOaCgYKAbASARASFQHGX2Mi5wt2uze57CiPI3itu5msAw0171"
    });

    // Save the tokens in a database or session for future use

    // Redirect the user to a success page or perform other actions
    res.send('Authentication successful!');
  } catch (error) {
    console.error('Error authenticating:', error);
    res.status(500).send('Authentication failed.');
  }
});
assignmentRouter.post('/uploadFile', upload.single('file'), async (req, res) => {
  try {
    console.log(import.meta.url)
  //   const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
  // const __dirname = path.dirname(__filename);
  //   const filePath = path.join("C:\\Users\\IT EXPERT\\Desktop\\AssignmentPortalServer\\", req.file.path);
    const fileMetadata = {
      name: req.file.originalname,
      parents: ['1Q09niCuzWb6nsrs-U_Tx6h2SFbQRcEFb']  // Specify the folder ID here
    };
    const media = {
      mimeType: req.file.mimetype,
      body: fs.createReadStream(`C:\\Users\\IT EXPERT\\Desktop\\AssignmentPortalServer\\${req.file.path}`)
    };
    // console.log(fileMetadata,media)

    const response =  drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',

    });

    // Clean up the file from the server
    // fs.unlinkSync(filePath);
await response.then((res)=>console.log(res))
    res.send(`File uploaded successfully: ${response}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error uploading file');
  }
});
assignmentRouter.get('/files', async (req, res) => {
  try {
    const response = await drive.files.list({
      pageSize: 10, // Set the desired number of files to retrieve
      fields: 'files(name, id)', // Specify the fields to include in the response
    });
    const files = response.data.files;
    res.json(files);
  } catch (err) {
    console.error('Error listing files:', err);
    res.status(500).json({ error: 'Failed to list files' });
  }
});
assignmentRouter.get('/', async (req, res) => {
  try {
    const assignments = await Assignment.find()
    let allAssignments = []
    let file = null;
    let base64String = [];
    // let allAssignments = {};
    await Promise.all( assignments.map(async (doc) => {
      if (doc.teacherAttachedFileIds && doc.teacherAttachedFileIds.length > 0) {
        // Create an array of promises
        const filePromises = doc.teacherAttachedFileIds.map(async (fileId) => {
          const files = await gfs.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
          if (files && files.length > 0) {
            const fileToStream = gfs.openDownloadStreamByName(files[0].filename);
            const chunks = [];

            fileToStream.on('data', (chunk) => {
              chunks.push(chunk);
            });

            return new Promise((resolve, reject) => {
              fileToStream.on('end', () => {
                const fileBuffer = Buffer.concat(chunks);
                const base64Data = fileBuffer.toString('base64');
                resolve(base64Data);
              });
              fileToStream.on('error', (err) => {
                reject(err);
              });
            });
          }
        });

        // Wait for all promises to resolve
        base64String = await Promise.all(filePromises);
        
      }
      allAssignments.push({base64String,doc})


   

    }))

    res.json({ allAssignments})

  }
  catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }

// res.pipe(assignments)

})
assignmentRouter.post('/upload', uploads.array('files', 5), async (req, res) => {
  const fileNames = req.files.filter(file =>file.size<=1000).map(file=>file.id);
  const { title, desc, courseId,deadline } = req.body
console.log(fileNames)
if(fileNames?.length){
  const assignment = await Assignment.create({
    title,
    desc,
    courseId,
    deadline,
    teacherAttachedFileIds: fileNames
  })
  const createdAssignment = await Assignment.findById(assignment._id).select('-courseId')
  if (!createdAssignment)
    return res.status(400).send({ error: 'Something went wrong' })
  return res.status(200).send({ assignment: createdAssignment })



}})

assignmentRouter.get('/assignment/:id', async (req, res) => {
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

    if (assignment.teacherAttachedFileIds && assignment.teacherAttachedFileIds.length > 0) {
      // Create an array of promises
      const filePromises = assignment.teacherAttachedFileIds.map(async (fileId) => {
        const files = await gfs.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
        if (files && files.length > 0) {
          const fileToStream = gfs.openDownloadStreamByName(files[0].filename);
          const chunks = [];

          fileToStream.on('data', (chunk) => {
            chunks.push(chunk);
          });

          return new Promise((resolve, reject) => {
            fileToStream.on('end', () => {
              const fileBuffer = Buffer.concat(chunks);
              const base64Data = fileBuffer.toString('base64');
              resolve(base64Data);
            });
            fileToStream.on('error', (err) => {
              reject(err);
            });
          });
        }
      });

      // Wait for all promises to resolve
      base64String = await Promise.all(filePromises);
    }

    res.json({ base64String, assignment });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }

})
assignmentRouter.post("/del/:id", async (req, res) => {
  const assignemnt = await Assignment.findById(req.params.id)

  gfs.delete(new mongoose.Types.ObjectId(assignemnt.teacherAttachedFile), (err, data) => {
    if (err) return res.status(404).json({ err: err.message });
    res.redirect("/");
  });
  await Assignment.findByIdAndDelete(req.params.id)
});
export default assignmentRouter