import mongoose, {isValidObjectId} from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

// Cloudinary public id
// const findCloudinaryPublicId = (url) => {
//   const videoLinkSplit = url.split("/")
//   const video_public_id = videoLinkSplit[videoLinkSplit.length - 1].split(".")[0]
//   return video_public_id
// }


//Here we are getting all the video on the home page
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  
    // retreive all videos from the databases
    // apply the query based filtering if the query is present
    // Sort video besed on sortBy and sortType
    // retrieve the appropriate page of videos based on the page number and the limit
  
    try {
      let aggregationPipeline = [];
  
      //filters videos based on a case-insensitive regular expression match in the title field
      if (query) {
        aggregationPipeline.push({
          $match: {
            title: {
              $regex: query,
              $options: "i",
            },
          },
        });
      }
  
      if (userId) {
        aggregationPipeline.push({
          $match: { userId: userId },
        });
      }
  
      // arranges videos in a specified order based on a given field and direction.
      if (sortBy) {
        aggregationPipeline.push({
          $sort: { [sortBy]: sortType },
        });
      }
  
      const videos = await Video.aggregatePaginate({
        pipeline: aggregationPipeline,
        page,
        limit,
      });
  
      return res
        .status(200)
        .json(new ApiResponse(200, videos, "videos fetched successfully"));
    } catch (error) {
      throw new ApiError(500, "Error while fetching videos");
    }
  });

//Here we are publishing the video
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    // const { userId } = req.user;
    if(!title || !description)
    {
        throw new ApiError(400, "All fields mustn't be empty"); 
    }    
    // Get the video file from the request
    const videoFile = req.files?.videoFile[0].path;
    const thumbnail = req.files?.thumbnail[0].path;

    if(!videoFile || !thumbnail){
        throw new ApiError(400, "Video and thumbnail are required");
    }
    
    // Upload the video file to Cloudinary
    const videoFileResponse = await uploadOnCloudinary(videoFile);
    const thumbnailResponse = await uploadOnCloudinary(thumbnail);

    if(!videoFileResponse.secure_url || !thumbnailResponse.secure_url){
        throw new ApiError(400, "Video and thumbnail are required");
    }

    //Duration of the video
    const videoDuration = videoFileResponse?.duration;
    const user = req.user;
    
    // Create a video using the Cloudinary response and other data
    const video = await Video.create({
        title,
        description,
        videoFile: videoFileResponse.url,
        thumbnail: thumbnailResponse.url,
        duration: videoDuration,
        owner : user
    });
    
    
    return res
    .status(201)
    .json(new ApiResponse(201, video, "Video published successfully"));
});

// Here we are getting the video by id 
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  if(!isValidObjectId(videoId))
  {
    throw new ApiError(400, "Invalid video id")
  }
  const video = await Video.findById(videoId)
  if(!video)
  {
    throw new ApiError(404, "No video found")
  }
  
  return res
  .status(200)
  .json(new ApiResponse(200,video, "Video fetched successfully"))
})

//Here we are updating the video
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  const { title, description } = req.body
  //TODO: update video details like title, description, thumbnail
  if(!title || !description)
  {
    throw new ApiError(400, "All fields mustn't be empty")
  }

  //updating the thumbnail
  const thumbnailLocalPath = req.file?.path
  if(!thumbnailLocalPath)
  {
    throw new ApiError(400, "Thumbnail is required")
  }

  const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(400, "something wrong happened while fetching video");
    }

  // check you are the owner of this video or not
  if (!req.user._id.equals(video.owner._id)) 
  {
    throw new ApiError(400, "you are not the owner of this video");
  }

  //Delete the old thumbnail from cloudinary
  if(video.thumbnail){
    const oldThumbnail = video.thumbnail.split("/").pop().split(".")[0];
    await deleteFromCloudinary(oldThumbnail);
  }

  //upload new thumbnail
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

  const videos = await Video.findByIdAndUpdate(
    videoId, 
    {
      $set:{
        title: title, 
        description: description,
        thumbnail: thumbnail.url
      }
    },
    {
      new: true
    })

  return res
  .status(200)
  .json(new ApiResponse(200, videos, "Video updated successfully"))

})

//Here we are deleting the video
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  //TODO: delete video
  const video= await Video.findByIdAndDelete(videoId)
  if(!video)
  {
    throw new ApiError(404, "No video found")
  }
  // check you are the owner of this video or not
  if (!req.user._id.equals(video.owner._id)) 
  {
    throw new ApiError(400, "you are not the owner of this video");
  }

  //Delete the video from cloudinary
  if(video.videoFile){
    const deletedVideo = video.videoFile.split("/").pop().split(".")[0];
    await deleteFromCloudinary(deletedVideo);
  }

  return res
  .status(200)
  .json(new ApiResponse(200, video, "Video deleted successfully"))
})

//Here we are toggling the publish status
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  const video = await Video.findById(videoId)
  if(!video)
  {
    throw new ApiError(404, "No video found")
  }
  // check you are the owner of this video or not
  if (!req.user._id.equals(video.owner._id)) 
  {
    throw new ApiError(400, "you are not the owner of this video");
  }
  video.isPublished = !video.isPublished
  const updatedVideo = await video.save()
  return res
  .status(200)
  .json(new ApiResponse(200, updatedVideo, "Video publish status updated successfully"))
})

export {
  getAllVideos, 
  publishAVideo, 
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus
}