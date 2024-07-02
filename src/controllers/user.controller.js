import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { Mongoose } from "mongoose";

const genrateAccessAndRefreshTokens = async (userID) => {
  try {
    const user = await User.findById(userID)
    const refreshToken = user.genrateRefreshToken()
    console.log(refreshToken)
    const accessToken = user.genrateAccessToken()

    user.refreshToken = refreshToken

    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }

  } catch (error) {
    throw new ApiError(500, "Unable generate Refresh or AcessToken")
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
  console.log(avatar, "avatar")
  console.log(coverImage, "coverImage")


  if (!avatar) {

    throw new ApiError(400, "Avatar file is required")
  }

  const data = await User.create({
    fullname: fullName,
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

  return res.status(201).json(
    new ApiResponse(200, checkUserCreated, "User Register sucessfully")
  )
  return res.status(200)
})

const loginUser = asyncHandler(async (req, res) => {

  const { email, username, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "username or email is required")
  }
  const user = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (!user) {
    throw new ApiError(404, "User does not exits")
  }
  const isPasswordCorrect = await user.isPasswordCorrect(password)
  if (!isPasswordCorrect) {
    throw new ApiError(404, "password incorrect")
  }


  const { accessToken, refreshToken } = await genrateAccessAndRefreshTokens(user._id)


  const loggedInUser = await User.findById(user._id).select("-password -refershToken")

  const options = {
    httpOnly: true,
    secure: true
  }

  return res.status(200)
    .cookie("acecesToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, {
      user: loggedInUser, accessToken, refreshToken
    }, "user logged In Sucessfully"))

})


const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    { new: true }
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res.status(200)
    .clearCookie("acecesToken", accessToken, options)
    .clearCookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, {}, "user logged out"))


})


const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request")
  }
  try {
    const decodedToken = await jwt.verfiy(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)

    if (!user) {
      throw new ApiError(401, "Invalid refresh Token")
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used ")
    }

    const options = {
      httpOnly: true,
      secure: true
    }

    const { accessToken, newrefreshToken } = await genrateAccessAndRefreshTokens(user._id)

    return res.status(200)
      .cookie("accesssToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(200,
          {
            accessToken, NewaccessToken: newrefreshToken
          }, "Token genrated")
      )
  } catch (error) {
    throw new ApiError(500, error?.message || "Invalid token")
  }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {

  const { oldPassword, newPassword } = req.body

  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password")
  }

  user.password = newPassword
  await user.save({ validateBeforeSave: false })

  return res.status(200).json(new ApiResponse(200, {}, "password changed successfully"))

})

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(200, req.user, "Current user fetched")
})


const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body

  if (!fullname || !email) {
    throw new ApiError(400, "All the fields are required")
  }

  const updatedUser = await User.findByIdAndUpdate(req.user?._id,
    {
      $set: {
        fullname,
        email
      }
    },
    {
      new: true
    }).select("-password")


  return res.status(200).json(new ApiResponse(200, updatedUser, "Account Details updated successfully"))

})

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path

  if (!avatarLocalPath) {
    new ApiError(400, "Avatar file is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar) {
    new ApiError(400, "Error while uploding avatar")
  }

  const updatedAvatar = await User.findByIdAndUpdate(req.user?._id, {
    $set: {
      avatar: avatar.url
    }
  }, {
    new: true
  }).select("-password")
  return res.status(200).json(new ApiResponse(200, updatedAvatar, "Avatar Image updated sucessfull"))

})
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverLocalPath = req.file?.path

  if (!coverLocalPath) {
    new ApiError(400, "cover file is missing")
  }

  const cover = await uploadOnCloudinary(coverLocalPath)

  if (!cover) {
    new ApiError(400, "Error while uploding coverImage")
  }

  const updatedCoverImage = await User.findByIdAndUpdate(req.user?._id, {
    $set: {
      coverImage: cover.url
    }
  }, {
    new: true
  }).select("-password")

  return res.status(200).json(new ApiResponse(200, updatedCoverImage, "Cover Image updated sucessfull"))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing")
  }

  const channel = await User.aggregate([
    {
      $match: { username: username?.toLowerCase() }
    },
    {
      $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    }, {
      $lookup: {
        rom: "subscription",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields:
      {
        subscriberCount: { $size: "$subscribers" },
        channelSubscribedToCount: { $size: "$subscribedTo" },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false
          }
        }
      }
    },
   { $project:{
      fullName:1,
      username:1,
      subscriberCount:1,
      channelSubscribedToCount:1,
      isSubscribed:1,
      avatar:1,
      coverImage:1,
      email:1,


    }}
  ])

console.log("Channel",channel)

if(!channel?.length){
  throw new ApiError(404,"Channel does not exists")
}

return res.status(200).json(new ApiResponse(200,channel[0],"User channel data fetched successfully"))

})


const getWatchHistory=asyncHandler(async(req,res)=>{
  const user=await User.aggregate([
    {
      $match:{_id:new Mongoose.Types.ObjectId(req.user._id)}
    },
    {
      $lookup:{
        from:"videos",
        locaField:"watchHistory",
        foreignField:"_id",
        as:"watchHistroy",
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:'owner',
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    fullName:1,
                    username:1,
                    avatar:1
                  }
                }
              ]
            }
          },{
            $addFields:{
              owner:{
                $first:"$owner"
              }
            }
          }
        ]
      }
    }
  ])

  return res.status(200).json(
    new ApiResponse(200,user[0].watchHistory),
    "Watch History Fetched Successfully"
  )
})

export {
  registerUser, loginUser, logoutUser, refreshAccessToken,

  changeCurrentPassword, getCurrentUser, updateUserDetails, updateAvatar, updateUserCoverImage, getUserChannelProfile,getWatchHistory
}