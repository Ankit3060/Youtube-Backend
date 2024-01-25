import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import Jwt  from "jsonwebtoken";
import mongoose, { syncIndexes } from "mongoose";


//Creating the method for access and refresh token so it can easily generate whenever we required
const generateAccessAndRefreshToken = async(userId)=>
{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        //Adding refresh token to data base 
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false});

        return {refreshToken,accessToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while registering the user")
    }
}

//Here we are registering the new user 
const registerUser = asyncHandler (async (req,res)=>{
    // res.status(200).json({
    //     message:"All is well"
    // })

    //Get user detail from frontend
    //validation mean no required field is empty
    //Check user is already exits by username or mail
    //Check for images and coveImage
    //upload on cloudinary
    //create user object - create entry db
    //Remove password and refresh token field from response
    //check for user creation
    //return res

    const {fullName, email, password, username} = req.body;
    // console.log("email:",email)

    //This is one by one method man we have to check each and everything one by one
    if(fullName===""){
        throw new ApiError(400,"Full name is required")
    }
    if(email===""){
        throw new ApiError(400,"email is required")
    }
    if(password===""){
        throw new ApiError(400,"password is required")
    }
    if(username===""){
        throw new ApiError(400,"username is required")
    }

    //this is another apporaoach without checking one by one

    // if(
    //     [fullName,email,username,password].some((field)=>field?.trim()==="")
    // ){
    //     throw new ApiError(400,"All field is required")
    // }

    const existedUser = await User.findOne({
        $or:[{username},{email}]
    })
    //If user is already register than it will send error
    if(existedUser){
        throw new ApiError(409,"User Already registered with this email or username");
    }

    //Creating the local file for the avatar and coverImage
    const avatarLocalPath  = req.files?.avatar[0]?.path;
    // const coverImageLocalPath  = req.files?.coverImage[0]?.path;
    
    // This is optional so we are using the below code above is mandotory one
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)
    {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    // console.log(req.files);
    // console.log(req.body);

    // console.log(existedUser);
    // console.log(avatarLocalPath);

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required");
    }

    //uploading the avatar and coverimage to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);


    if(!avatar){
        throw new ApiError(400,"Avatar is required");
    }

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

})

//Here we are logging in already register user
const loginUser = asyncHandler(async(req,res)=>{
    //Req body --> Data
    //username || email
    //find user
    //check password
    //Send access and refresh token 
    //send cookie

    const {email,username,password }=req.body;
    console.log(email)
    // if(!(username||email)){
    //     throw new ApiError(400,"Username or email is required");
    // }
    if(!username && !email){
        throw new ApiError(400,"username or email is required")
    }

    //Finding the user based on email or username
    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"User Not found");
    }

    //Checking the password
    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credential");
    }

    //Sending access and refresh token 
    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
    //sending the cookies
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("refreshToken",refreshToken,options)
    .cookie("accessToken",accessToken,options)
    .json(
        new ApiResponse(200,{user : loggedInUser,accessToken,refreshToken},
            "User loggedIn successfully")
    )
    
})

//Here we are logging out the user
const logoutUser  = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken : 1,  //Here we are removing the refresh Token
            }
        },
        {
            new : true
        }
    )

    //Removing the cokies
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
    
})

// Creating endpoint for refresh token
const refreshAccessToken = asyncHandler(async(req,res)=>{

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken)
    {
        throw new ApiError(401,"Unauthorize request")
    }

    try {
        const decodedToken = Jwt.verify(
            incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"refresh token is expired or used")
        }
    
        //Sending cookie
        const options = {
            httpOnly: true,
            secure: true
        }
    
        //Sending access and refresh token 
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("refreshToken",newRefreshToken,options)
        .cookie("accessToken",accessToken,options)
        .json(
            new ApiResponse(200,{accessToken,refreshToken: newRefreshToken},
                "Access token refreshed successfully")
        )
    } catch (error) {
        throw new ApiError(401,error?.message ||"Invalid refresh token")
    }
})


//Changing the current password
const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} =req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"incorrect password")
    }

    user.password=newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"))
})


//Here we are getting the information of the current user
const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"Current user fetched successfully"))
})

//Here we are updating the details of hte user
const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName,email} = req.body

    if(!(fullName || email)){
        throw new ApiError(400,"All field is required")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                fullName:fullName,
                email:email
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"details updated successfully"))

})

//Here we are updating the avatar files
const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    const user = await User.findById(req.user?._id).select("avatar");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Delete old avatar from Cloudinary
    if (user.avatar) {
        const oldAvatarPublicId = user.avatar.split("/").pop().split(".")[0];
        await deleteFromCloudinary(oldAvatarPublicId);
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url)
    {
        throw new ApiError(400,"Error while uploading avatar")
    }

    const updatedUser  = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
        ).select("-password")

        return res
        .status(200)
        .json(
            new ApiResponse(200,updatedUser,"Avatar updated successfully")
        )
})

//Here we are updating the coverImage files
const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover Image file is missing")
    }

    const user = await User.findById(req.user?._id).select("coverImage");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    //Delete old cover Image
    if (user.coverImage) {
        const oldCoverImagePublicId = user.coverImage.split("/").pop().split(".")[0];
        await deleteFromCloudinary(oldCoverImagePublicId);
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url)
    {
        throw new ApiError(400,"Error while uploading cover Image")
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage?.url
            }
        },
        {new:true}
        ).select("-password")

        return res
        .status(200)
        .json(
            new ApiResponse(200,updatedUser,"CoverImage updated successfully")
        )

})

//Get user channel profile info
const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params;
    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }

    // User.findById({username})
    //Here we are writing the mongoDB aggregate pipelines means joining two table
    const channel = await User.aggregate([
        {
            $match:{
                username : username?.toLowerCase()
            }
        },
        {
            //lookup aggregate combine the two table
            $lookup:{
                from: "subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscriberdTo"
            }
        },
        {
            //Addfield aggregate add extra field to the table
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelSubscribedToCount:{
                    $size:"$subscriberdTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in : [req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        //Here we are using project mean giving the selected thing only not full    
        {
            $project:{
                fullName:1,
                username:1,
                subscribersCount:1,
                channelSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }
    ]) 

    if(!channel?.length){
        throw new ApiError(400,"channel does not exists");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline:[
                    { //This is first pipeline
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                { //this is 1st pipeline sub pipeline
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    { //this is second pipeline
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,user[0].watchHistory,"watch history fetched successfully")
    )
})

export {
    registerUser, 
    loginUser, 
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}