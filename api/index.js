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
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
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