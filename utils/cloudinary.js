import {v2 as cloudinary} from "cloudinary"
import fs from 'fs'

cloudinary.config({
    cloud_name: 'dvidvllsh',
    api_key: '268882725547574',
    api_secret: 'f5fzIF5mn2dC6swxWWu07SGb9i0',
    secure: true,
  });
  const uploadOnCloudinary = async (localFilePath) => {
    try {
        console.log(localFilePath)
        if (!localFilePath) return 'sabbeb'
        const response=cloudinary.uploader.upload(localFilePath,{resource_type:'auto'})
    fs.unlinkSync(localFilePath)
    return response
    }
    catch(e){
        console.log(e)
        fs.unlinkSync(localFilePath)
        return null;
    }
}
export default uploadOnCloudinary