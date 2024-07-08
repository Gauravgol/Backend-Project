import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video

    if ([title, description].some((data) => data?.trim() === '')) {
        throw new ApiError(400, "All fields are rquired")
    }


    const videoLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailImageLocalPath = req.files?.thumbnail[0]?.path;

    if (!videoLocalPath) {
        throw new ApiError(400, "video is missing")
    }
    if (!thumbnailImageLocalPath) {
        throw new ApiError(400, "thumbnailImageLocalPath is missing")
    }


    //Uploading video on Cloudinary
    const video = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailImageLocalPath)
    if (!video) {
        throw new ApiError(400, "Error While uploading video")
    }

    const videoData = await Video.create({
        videoFile: video.url,
        thumbnail: thumbnail?.url || "",
        title: title,
        description: description,
        duration: video?.duration || 10

    })
    if (!videoData) {
        throw new ApiError(500, "unable  To upload video")
    }



    return res.status(200).json(new ApiResponse(200, videoData, "Working fine G, Video uploaded successfully",))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}