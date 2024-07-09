import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

})

const addComment = asyncHandler(async (req, res) => {

    if (req.body.content === '') {
        throw new ApiError(400, "Comment cannot be empty")
    }
    if (req.params.videoId === '') {
        throw new ApiError(400, "video id is required ")
    }
    console.log("Id", req.params.videoId, "Body", req.body.content, "video id", req.user._id)

    const comment = await Comment.create({
        content: req.body.content,
        video: req.params.videoId,
        owner: req.user._id

    })

    res.status(200).json(new ApiResponse(200, comment, "Comment added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}