import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";



export const verifyJWT = asyncHandler(async (req, res, next) => {

  try {
    // const token = await req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "")
    const token = req.header("Authorization")

    console.log("token", token)

    if (!token) {
      throw new ApiError(401, "Unauthorized user")
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    console.log("Decodede token", decodedToken)

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")


    if (!user) {
      throw new ApiError(401, "Invalid access Token")
    }
    req.user = user;
    next()
  } catch (error) {
    throw new ApiError(400, "Invalid Access token")
  }

})