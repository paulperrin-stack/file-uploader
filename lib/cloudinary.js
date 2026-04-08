import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = (buffer, filename) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto' },  // remove public_id entirely, let Cloudinary generate it
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(buffer);
    });
};