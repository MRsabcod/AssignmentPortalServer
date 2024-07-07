import express from 'express'
import userRouter from './user.js'
import assignmentRouter from './assignment.js'
import teacherRouter from './teacher.js'

const router=express.Router()

router.use('/users',userRouter)
router.use('/teachers',teacherRouter)
router.use('/assignments',assignmentRouter)
export default router