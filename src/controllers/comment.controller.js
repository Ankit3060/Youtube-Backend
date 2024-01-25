import mongoose from 'mongoose';
import { Comment } from '../models/comment.models.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

//Here we are getting the videos all comments
const getVideoComments = asyncHandler(async (req, res) => {
    
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }

    const comment = await Comment.aggregatePaginate([
        {
            $match:{
                video: new mongoose.Types.ObjectId(videoId )
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner"
            }
        },
        {
            $unwind:"$owner"
        },
        {
            $project:{
                "owner.password":0,  //don't show password
                "owner.__v":0,  //mongoose version key don't show
                "owner.avatar":1,
                "owner.username":1

            }
        }
    ],{
        page,
        limit
    })

    return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment fetched successfully"))
})

// Here we are adding the comment
const addComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }

    const {content} = req.body
    if(!content){
        throw new ApiError(400, "Content is required")
    }

    const comment = await Comment.create({
        content,
        video:videoId,
        owner:req.user._id
    })

    return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment added successfully"))
})

//Here we are updating the comment
const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const {content} = req.body

    if(!mongoose.isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment id")
    }

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content:content
            }
        },
        {
            new:true
        })

        return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    if(!mongoose.isValidObjectId(commentId))
    {
        throw new ApiError(400, "Invalid comment id")
    }

    const comment = await Comment.findByIdAndDelete(commentId)

    if(!comment)
    {
        throw new ApiError(404, "No comment found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment deleted successfully"))
})


export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}