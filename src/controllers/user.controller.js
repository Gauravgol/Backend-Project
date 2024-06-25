import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import ApiResponse from "../utils/ApiResponse.js";



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

export { registerUser }