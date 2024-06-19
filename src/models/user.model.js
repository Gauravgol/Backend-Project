import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"


const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,// this will help in serching
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        avatar: {
            type: String, // we will use cloudinary
            required: true,

        },
        coverImage: {
            type: string
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, "Password is required"]
        },
        refershToken: {
            type: String
        },

        timestamps: true

    }

)

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password =await  bcrypt.hash(this.password, 6)
    next()
})

userSchema.methods.isPasswordCorrect=async function(password){
return await bcrypt.compare(password,this.password)
}

userSchema.methods.genrateAccessToken=function(){
return jwt.sign(
    {
        _id:this._id,
        email:this.email
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
)
}
userSchema.methods.genrateRefrehToken=function(){
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const User = mongoose.model("User", userSchema)