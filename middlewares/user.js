import jwt from 'jsonwebtoken'
import User from '../Models/User.js'
import Teacher from '../Models/teacher.js'

const verifyToken=async(req,res,next) => { 
    console.log(req.cookies,req.headers)
    try{
        const token= req.header('Authorization')?.replace( 'Bearer ', '')
if(!token){
    return res.status(401).json({message:'Access Denied'})
}
const decodedToken= jwt.verify(token,process.env.REFRESH_TOKEN_SECRET)
const user = await User.findById(decodedToken?._id).select("-password ")
const teacher=await Teacher.findById(decodedToken?._id).select( "-password ")

console.log(user,teacher)
if(!user && !teacher){
    return res.status(401).json({message:' Token INVALID!! '})
}
if(user)
req.user = user
if(teacher)
    req.teacher = teacher
next()
}
    catch(e){
        console.log(e)
        res.status(401).send('Unauthorized')
    }
}

export default verifyToken