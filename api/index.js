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



// import credentials from './credentials.json'  assert {type:"json"}
dotenv.config();
const app=express()
app.use(cookieParser())
app.use(express.json())
app.use(cors({}));
app.use(express.urlencoded({ extended: false }))

connectDB()
.then(() => {

    app.listen( 8000, () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    })
})
app.get('/', (req, res) => {
    res.send('Hello World!')
  })

app.use('/',router)
// console.log(serviceAccount)