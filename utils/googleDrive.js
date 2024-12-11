import { google } from "googleapis";
import { Stream } from 'stream';
import dotenv from 'dotenv'
dotenv.config();
// import {serviceAccount} from '../api/index.js'
console.log(process.env.PORT)
const serviceAccount =  JSON.parse(process.env.CRED)
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

async function uploadFile (fileObject){
    // console.log(fileObject)
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
export default uploadFile
