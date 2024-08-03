import express from 'express'
import User from '../Models/User.js'

import fs from 'fs'
import { upload } from '../middlewares/multer.js'
// import { verify } from 'jsonwebtoken'
import verifyToken from '../middlewares/user.js'
import uploadOnCloudinary from '../utils/cloudinary.js'
import StudentAssignments from '../Models/StudentAssignments.js'


const userRouter = express.Router()

const generateToken = async (userId) => {
    try {
        const user = await User.findById(userId)

        const token = user.generateRefreshToken()

        // user.refreshToken = token
        // await user.save({ validateBeforeSave: false })

        return { token }


    } catch (error) {
        console.log(error)


    }
}
userRouter.get('/', async (req, res) => {
    const users = await User.find()
    res.send({ data: users, message: "FETCH SUCCESSFULLY" })
})
userRouter.post('/register', upload.fields([{ name: "avatar", maxCount: 1 }]), async (req, res) => {
    const { email, fullName, cnic, contact,courses } = req.body
    const password = Math.random(9)
    //    console.log(req.files?.avatar[0]?.path)
    //    if (req.file) {
    //     avatarLocalPath = 'public/temp/'+req.file.filename;
    // }

    const existedUser = await User.findOne({
        $or: [{ cnic }, { email }]
    });
    if (existedUser) {
        // fs.unlinkSync(avatarLocalPath)
        res.status(400).send({ error: 'Username or email already exists' })
    };
    // const avatarLocalPath = req?.files?.avatar[0]?.path || '';
    // if (!avatarLocalPath) return res.status(400).send({error:'Avatar file is required'})
    // const avatar = await uploadOnCloudinary(avatarLocalPath)
    // console.log(avatar)
    const user = await User.create({
        fullName,
        // avatar: avatar?.url || '',
        cnic,
        email,
        password,
        contact,
        courses
    });
    const createdUser = await User.findById(user._id).select("-refreshToken");
    if (!createdUser) return res.send({ error: 'user not created' })
    const createdStudentAssignments = await StudentAssignments.create({
        studentId: createdUser._id,
        studentName: createdUser.fullName
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
    const user = await User.findOne({ $or: [{ cnic }, { email }], password: { $exists: true } })
    if (!user) return res.status(400).send({ error: "username or email is not registered" })
    const isMatch = await user.isCorrectPassword(password)
    if (!isMatch) return res.status(400).send({ error: "password is incorrect" })
    const { token } = await generateToken(user._id)
const rollNo=user?.courses?.rollNo
    console.log(token)

    res.send({ user, token,rollNo })
    // console.log(res.header('set-cookie'))
})

userRouter.post('/logout', verifyToken, (req, res) => {
    console.log(req.user.refreshToken)
    User.findById(req.user._id, {
        $pull: { refreshToken: req.user.refreshToken }
    }, {
        new: true
    })
    res.clearCookie("accessToken")
    res.status(200).send({ msg: 'done' })
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
