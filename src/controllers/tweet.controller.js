import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

//Here we are creating the tweet
const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body
    if(!content){
        throw new ApiError(400, "Content is required")
    }
    const tweet = await Tweet.create({
        owner:req.user._id,
        content : content
    })

    return res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet created successfully"))
})

//Here we are getting the user tweets
const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user id")
    }

    const tweet = await Tweet.find({owner:userId})
   
    if(!tweet){
        throw new ApiError(404, "No tweet found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet fetched successfully"))
})

//Here we are updating the tweet
const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const {content} = req.body

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id")
    }

    const tweet = await Tweet.findByIdAndUpdate(
        tweetId, 
        {
            $set:{
                content:content
            }
        }, 
        {
            new:true
        })

    if(!tweet){
        throw new ApiError(404, "No tweet found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,tweet, "Tweet updated successfully"))
})

//Here we are deleting the tweet
const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id")
    }
    const tweet = await Tweet.findByIdAndDelete(tweetId)
    if(!tweet){
        throw new ApiError(404, "No tweet found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet deleted successfully"))
})


export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}