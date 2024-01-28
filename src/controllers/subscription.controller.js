import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

// controller to toggle subscription
const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
  
    // 1. check if channel exists
    // 2. check if user is already subscribed
    // 3. if yes, unsubscribe
    // 4. if no, subscribe
    // 5. return response
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel id")
    }
    try {
        const existingSubscription = await Subscription.findOne({
            channel: channelId,
            subscriber: req.user._id
        })
        if(existingSubscription){
            await existingSubscription.remove()
            return res
            .status(200)
            .json(new ApiResponse(200, existingSubscription, "Unsubscribed successfully"))
        }
        else{
            const newSubscription = await Subscription.create({
                channel: channelId,
                subscriber: req.user._id
            })
            return res
            .status(200)
            .json(new ApiResponse(200, newSubscription, "Subscribed successfully"))
        }
    } catch (error) {
        throw new ApiError(500, `Error while toggling subscription: ${error.message}`)
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel id")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match:{
                channel:mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscriber"
            }
        },
        {
            $unwind:"$subscriber"
        },
        {
            $project:{
                _id:"$subscriber._id",
                username:"$subscriber.username",
                avatar:"$subscriber.avatar",
                fullname:"$subscriber.fullname"
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        },
        {
            $count:"totalSubscribers"
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "Invalid subscriber id")
    }
    const subscribedChannels = await Subscription.aggregate(
        [
            {
                $match:{
                    subscriber:mongoose.Types.ObjectId(subscriberId)
                }
            },
            {
                $lookup:{
                    from:"users",
                    localField:"channel",
                    foreignField:"_id",
                    as:"channel"
                }
            },
            {
                $unwind:"$channel"
            },
            {
                $project:{
                    _id:"$channel._id",
                    username:"$channel.username",
                    avatar:"$channel.avatar",
                    fullname:"$channel.fullname"
                }
            },
            {
                $sort:{
                    createdAt:-1
                }
            },
            {
                $count:"totalSubscribedChannels"
            }
        ]
    )

    return res
    .status(200)
    .json(new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully"))
})

export{
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}