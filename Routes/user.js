import express from 'express'
import User from '../Models/User.js'
import verifyToken from '../middlewares/user.js'
import StudentAssignments from '../Models/StudentAssignments.js'
import Course from '../Models/Course.js'

const userRouter = express.Router()

const generateToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const token = user.generateRefreshToken()
        return { token }
    } catch (error) {
        console.log(error)


    }
}

userRouter.get('/', async (req, res) => {
    const users = await User.find()
    res.send({ data: users, message: "FETCH SUCCESSFULLY" })
})

userRouter.post('/register', async (req, res) => {
    const { email, fullName, cnic, contact,courses } = req.body
    const password = Math.random(9)
    const existedUser = await User.findOne({
        $or: [{ cnic }, { email }]
    });
    if (existedUser) {
        res.status(400).send({ error: 'Username or email already exists' })
    }
    const user = await User.create({
        fullName,
        cnic,
        email,
        password,
        contact,
        courses
    });
    const createdUser = await User.findById(user._id).select("-refreshToken");
    const courseIds=createdUser.courses?.map((course)=>{return {courseId:course.ID}})
    if (!createdUser) return res.send({ error: 'user not created' })
    const createdStudentAssignments = await StudentAssignments.create({
        studentId: createdUser._id,
        studentName: createdUser.fullName,
    courses:courseIds
    })
    
    
    if (!createdStudentAssignments) return res.send({ error: 'userAssignmentPortal not created' })

    res.status(200).send({ createdUser, message: "REGISTER SUCCESSFULLY", createdStudentAssignments })

})

userRouter.post('/createPassword', async (req, res) => {
    const { password, cnic, email } = req.body
    const user = await User.findOne({ $or: [{ cnic }, { email }] })
    if (!user) return res.status(400).send({ error: "cnic or email is invalid" })
    await user.encryptPassword(user, password)
    // user.password=password
            await user.save()
    res.send({ password: user.password, message: "password created successfully" })
})

userRouter.post('/login', async (req, res) => {
    const { email, password, cnic } = req.body
    if (!(cnic || email)) {
        return res.status(400).send({ error: "username or email is required" })
    }
    const user = await User.findOne({ $and: [{ cnic }, { email }], password: { $exists: true } })
    if (!user) return res.status(400).send({ error: "username or email is not registered" })
    const isMatch = await user.isCorrectPassword(password)
    if (!isMatch) return res.status(400).send({ error: "password is incorrect" })
    const { token } = await generateToken(user._id)
const coursesDetails=await Promise.all(user.courses.map(async(course)=>{return await Course.findById(course.ID)}))

    // console.log(token)
    res.send({ user, token,coursesDetails })
})

userRouter.post('/updatePassword', async (req, res) => {
    const { oldPassword, newPassword, cnic } = req.body
    if (!oldPassword || !newPassword) return res.status(400).send({
        error:
            "old password and new password are required"
    })
    const user = await User.find({ cnic })
    const isMatch = await user[0].isCorrectPassword(oldPassword)
    if (!isMatch) return res.status(400).send({ error: "old password is incorrect" })
    await user[0].encryptPassword(user[0], newPassword)

    res.status(200).send({ msg: "password updated successfully" })

})

export default userRouter
