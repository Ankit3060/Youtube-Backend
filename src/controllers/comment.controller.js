import mongoose from 'mongoose';
import { Comment } from '../models/comment.models.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
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
                "owner.password":0,
                "owner.__v":0
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

export {
    getVideoComments
}