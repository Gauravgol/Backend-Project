import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import ApiResponse from "../utils/ApiResponse.js";
import  jwt  from "jsonwebtoken";

const genrateAccessAndRefreshTokens=async(userID)=>{
  try {
  const user=  await User.findById(userID)
  const refreshToken= user.genrateRefreshToken()
  console.log(refreshToken)
  const accessToken=user.genrateAccessToken()

  user.refreshToken=refreshToken
  
  await user.save({validateBeforeSave:false})

  return {accessToken,refreshToken}
    
  } catch (error) {
    throw new ApiError(500,"Unable generate Refresh or AcessToken")
  }
}

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body

  // if(fullName===''){
  //    throw new ApiError(400,"Full name is required")
  // }
  if ([fullName, email, username, password].some((field) => field?.trim() === '')) {
    throw new ApiError(400, "All field is required")
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  })
  if (existedUser) {
    throw new ApiError(409, "User alredy exists")
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  console.log(avatar,"avatar")
  console.log(coverImage,"coverImage")


  if (!avatar) {
    
    throw new ApiError(400, "Avatar file is required")
  }

  const data = await User.create({
    fullname:fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),

  })

  const checkUserCreated = await User.findById(data._id).select(
    "-password -refreshToken"
  )// this method will remove pass and refretoken 
  if (!checkUserCreated) {
    throw new ApiError(500, "unable create user some server Error")
  }

 return  res.status(201).json(
  new ApiResponse(200,checkUserCreated,"User Register sucessfully")
 ) 
  return res.status(200)
})

const loginUser=asyncHandler(async(req,res)=>{

const {email,username,password}=req.body;

if(!(username||email)){
throw new ApiError(400,"username or email is required")
}
const user=await User.findOne({
  $or: [{username},{email}]
})

if(!user){
  throw new ApiError(404,"User does not exits")
}
const isPasswordCorrect= await user.isPasswordCorrect(password)
if(!isPasswordCorrect){
  throw new ApiError(404,"password incorrect")
}


const {accessToken,refreshToken}=await genrateAccessAndRefreshTokens(user._id)


const loggedInUser=await User.findById(user._id).select("-password -refershToken")

const options={
  httpOnly:true,
  secure:true
}

return res.status(200)
.cookie("acecesToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(new ApiResponse(200,{
  user:loggedInUser,accessToken,refreshToken
},"user logged In Sucessfully"))

})


const logoutUser=asyncHandler(async(req,res)=>{
await User.findByIdAndUpdate(
  req.user._id,
  {
    $set:{
      refreshToken:undefined
    }
  },
  {new:true}
)

const options={
  httpOnly:true,
  secure:true
}

return res.status(200)
.clearCookie("acecesToken",accessToken,options)
.clearCookie("refreshToken",refreshToken,options)
.json(new ApiResponse(200,{},"user logged out"))


})


const refreshAccessToken=asyncHandler(async(req,res)=>{
  const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError(401,"Unauthorized request")
  }
 try {
  const decodedToken=await  jwt.verfiy(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
 
  const user=await User.findById(decodedToken?._id)
 
  if(!user){
   throw new ApiError(401,"Invalid refresh Token")
 }
 
 if(incomingRefreshToken!==user.refreshToken){
   throw new ApiError(401,"Refresh token is expired or used ")
 }
 
 const options={
   httpOnly:true,
   secure:true
 }
 
 const {accessToken,newrefreshToken}=await genrateAccessAndRefreshTokens(user._id)
 
 return res.status(200)
 .cookie("accesssToken",accessToken,options)
 .cookie("refreshToken", newrefreshToken,options)
 .json(
   new ApiResponse(200,
     {
       accessToken,NewaccessToken:newrefreshToken
     },"Token genrated")
 )
 } catch (error) {
  throw new ApiError(500,error?.message || "Invalid token")
 }

})



export { registerUser, loginUser,logoutUser,refreshAccessToken}