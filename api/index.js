import express from 'express'
import cors from 'cors'
import router from '../Routes/index.js';
import {connectDB} from '../db/index.js';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser'

dotenv.config();
const app=express()
app.use(cookieParser())
app.use(express.json())
<<<<<<< HEAD
app.use(cors());
=======
app.use(cors({}));
>>>>>>> 9ac696c749f5a97e359d5e218798ad4d489c8b9e
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
