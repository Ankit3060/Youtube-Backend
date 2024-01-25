import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

//Here we are liking and unliking the video
const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }
    // const {userId} = req.user
    const existingike = await Like.findOne(
        { 
            video: videoId, 
            likedBy: req.user._id
        })
    
        //Here we are unliking the video
    if(existingike)
    {
        await existingike.remove()
        return res
        .status(200)
        .json(new ApiResponse(200, existingike, "Video unliked successfully"))
    }
    //Here we are liking the video
    else{
        const newLike = await Like.create({
            video:videoId,
            likedBy:req.user._id
        })

        return res
        .status(200)
        .json(new ApiResponse(200, newLike, "Video liked successfully"))
    }
})

//Here we are liking and unliking the comment
const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    if(!isValidObjectId(commentId))
    {
        throw new ApiError(400, "Invalid comment id")
    }

    const existingLike = await Like.findOne({
        comment:commentId,
        likedBy:req.user._id
    })

    if(existingLike){
        await existingLike.remove()
        return res
        .status(200)
        .json(new ApiResponse(200, existingLike, "Comment unliked successfully"))
    }
    else{
        const newLike = await Like.create({
            comment:commentId,
            likedBy:req.user._id
        })

        return res
        .status(200)
        .json(new ApiResponse(200, newLike, "Comment liked successfully"))
    }
})

//Here we are liking and unliking the tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    
    if(!isValidObjectId(tweetId))
    {
        throw new ApiError(400, "Invalid tweet id")
    }

    const existingLike = await Like.findOne({
        tweet:tweetId,
        likedBy:req.user._id
    })
    if(existingLike){
        await existingLike.remove()
        return res
        .status(200)
        .json(new ApiResponse(200, existingLike, "Tweet unliked successfully"))
    }
    else{
        const newLike = await Like.create({
            tweet:tweetId,
            likedBy:req.user._id
        })

        return res
        .status(200)
        .json(new ApiResponse(200, newLike, "Tweet liked successfully"))
    }
})

//Here we are getting all the liked videos
const getLikedVideos = asyncHandler(async (req, res) => {
    const {userId} = req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user id")
    }
    const {page=1, limit=10} = req.query
    const parsedLimit = parseInt(limit);
    const pageSkip = (page - 1) * parsedLimit;

    const allLikedVideos = await Like.find({likedBy:userId})
    .skip(pageSkip)
    .limit(parsedLimit)
    .populate({
        path:"video",
        select:"title description thumbnail",
        populate:{
            path:"owner",
            select:"username avatar"
        }
    })

    return res
    .status(200)
    .json(new ApiResponse(200, allLikedVideos, "Liked videos fetched successfully"))
})


export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}