import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

//Here we are creating the playlist
const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!name || !description){
        throw new ApiError(400, "Name and description are required")
    }

    try {
        const playlist = await Playlist.create({
            name,
            description,
            owner: req.user._id
        })
    
        return res
        .status(201)
        .json(new ApiResponse(201, playlist, "Playlist created successfully"))
    } catch (error) {
        throw new ApiError(400, "Failed to create playlist. Please try again")  
    }
})

//Here we are getting the user playlists
const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user id")
    }
    
    const playlists = await Playlist.find({
        owner: userId
    })
    .populate("videos", "_id")
    .populate("owner", "username avatar fullname")

    if(!playlists){
        throw new ApiError(404, "No playlists found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, playlists, "Playlists fetched successfully"))
})

//Here we are getting the playlist by id
const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId))
    {
        throw new ApiError(400, "Invalid playlist id")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"))
})

//Here we are adding the video to the playlist
const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId))
    {
        throw new ApiError(400, "Invalid playlist id or video id")
    }
    const playlist = await Playlist.findOneAndUpdate(
        {
            _id:playlistId,
            owner:req.user._id
        },
        {
            $addToSet:{
                videos:videoId
            }
        },
        {
            new:true
        }
    
    )
    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video added to playlist successfully"))
})

//Here we are removing the video from the playlist
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId))
    {
        throw new ApiError(400, "Invalid playlist id or video id")
    }
    const playlist = await Playlist.findOneAndUpdate(
        {
            _id:playlistId,
            owner:req.user._id
        },
        {
            $pull:{
                videos:videoId
            }
        },
        {
            new:true
        }
    
    )

    if(!playlist){
        throw new ApiError(404, "Resource not found or ownership issue")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video removed from playlist successfully"))

})

//Here we are deleting the playlist
const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId))
    {
        throw new ApiError(400, "Invalid playlist id")
    }
    const playlist = await Playlist.findOneAndDelete(
        {
            _id:playlistId,
            owner:req.user._id
        }
    )
    if(!playlist){
        throw new ApiError(404, "Resource not found or ownership issue")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist deleted successfully"))
})

//Here we are updating the playlist
const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    if(!isValidObjectId(playlistId))
    {
        throw new ApiError(400, "Invalid playlist id")
    }
    const playlist = await Playlist.findOneAndUpdate(
        {
            _id:playlistId,
            owner:req.user._id
        },
        {
            name,
            description
        },
        {
            new:true
        }
    )
    if(!playlist){
        throw new ApiError(404, "Resource not found or ownership issue")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist updated successfully"))
})


export{
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}