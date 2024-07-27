import mongoose from 'mongoose'
import { Schema } from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
const userSchema = new Schema({
    fullName: {
        type: String,
        required: true
    },
    cnic: {
        type: String,
        required: true,

    },

    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,

    },
    refreshToken: {
        type: [String],
        default: [''],
        required: true
    },
    avatar: {
        type: String,
        // required:true
    },
    contact: {
        type: String,
        required: false,
    },
    courses:[
        {
            ID:{
                type:String
            },
            active: {
              type: Boolean,
              default: true
            },
            rollNo: {
                type: Number,
            }
        }
    ]
}, {
    timestamps: true
})

// userSchema.pre("save", async function (next) {
//     if(!this.isModified("password")) return next();

//     this.password =  bcrypt.hash(this.password, 10)
//     next()
// })
userSchema.methods.isCorrectPassword = async function (password) {

    return await bcrypt.compare(password, this.password)
}

userSchema.methods.encryptPassword = async function (user, password) {
    user.password = await bcrypt.hash(password, 10)
    await user.save()
     console.log(user.password)

}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        cnic: this.cnic,

    },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
userSchema.path('cnic').validate((e) => {
    return e?.length == 13
}, 'cnic code must be 13 characters')
const User = mongoose.model('User', userSchema)
export default User
