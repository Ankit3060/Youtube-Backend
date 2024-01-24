import {v2 as cloudinary} from 'cloudinary';
import fs from "fs";
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath)=>{
    try {
        if (!localFilePath) return null
        // Upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{resource_type : "auto"})
        // File has been uploaded successfully
        console.log("File has been updated successfully",response.url);
        fs.unlinkSync(localFilePath);
        console.log(response);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the local saved temperory file as the upload option got failed    
        return null;
    }
}

const deleteFromCloudinary = async(publicId)=>{
    try {
        if(!publicId) return null;

        const del = await cloudinary.uploader.destroy(publicId);
        console.log(del);
        console.log("File deleted successfully")
        return del;
    } catch (error) {
        console.log(error.message);
    }
}

// Function to delete an image from Cloudinary
// async function deleteFromCloudinary(publicId) {
    // Use your Cloudinary credentials and SDK to delete the image
    // Example using cloudinary npm package
    // const cloudinary = require('cloudinary').v2;
    // cloudinary.config({
    //     cloud_name: 'your_cloud_name',
    //     api_key: 'your_api_key',
    //     api_secret: 'your_api_secret'
    // });
    // await cloudinary.uploader.destroy(publicId);
// }

export {uploadOnCloudinary, deleteFromCloudinary}
