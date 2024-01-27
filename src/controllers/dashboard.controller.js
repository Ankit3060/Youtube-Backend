import mongoose from "mongoose"
import {Video} from "../models/video.models.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

// const getChannelStats = asyncHandler(async (req, res) => {

//     const {channelId} = req.params
    
//     if(!mongoose.isValidObjectId(channelId)){
//         throw new ApiError(400, "Invalid channel id")
//     }

//     const totalViews = await Video.aggregate([
//         {
//             $match: {
//                 channel: mongoose.Types.ObjectId(channelId)
//             }
//         },
//         {
//             $group: {
//                 _id: null,
//                 totalViews: {
//                     $sum: "$views"
//                 }
//             }
//         }
//     ])

//     if(!totalViews.length){
//         throw new ApiError(404, "Channel not found")
//     }

//     const totalSubscribers = await Subscription.countDocuments({
//         channel: mongoose.Types.ObjectId(channelId)
//     })

//     if(!totalSubscribers){
//         throw new ApiError(404, "Channel not found")
    
//     }

//     const totalVideos = await Video.countDocuments({
//         channel: mongoose.Types.ObjectId(channelId)
//     })

//     if(!totalVideos){
//         throw new ApiError(404, "Channel not found")
//     }

//     const totalLikes = await Like.countDocuments({
//         channel: mongoose.Types.ObjectId(channelId)
//     })
//     if(!totalLikes){
//         throw new ApiError(404, "Channel not found")
//     }

//     return res
//     .status(200)
//     .json(new ApiResponse(200, "OK", {}))
// })

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const channelStats = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(userId)
            }
        },
        
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"_id",
                foreignField:"channel",
                as:"videos"
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"channel",
                as:"likes"
            }
        },
        {
            $addFields:{
                totalSubscribers:{$size:"$subscribers"},
                totalVideos:{$size:"$videos"},
                totalLikes:{$size:"$likes"},
                totalViews:{$sum:"$videos.views"}
            }
        },
    ])
    return res
    .status(200)
    .json(new ApiResponse(200, "OK", channelStats[0]))
})

export {
    getChannelStats
}