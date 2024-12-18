// import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse, UploadApiOptions } from "cloudinary";
// import config from "config";
// import { FileData, FileStorage } from "../types/storage";

// export class CloudinaryStorage implements FileStorage {
//     constructor() {
//         cloudinary.config({
//             cloud_name: config.get<string>("cloudinary.cloudName"),
//             api_key: config.get<string>("cloudinary.apiKey"),
//             api_secret: config.get<string>("cloudinary.apiSecret"),
//         });
//     }

//     async upload(data: FileData): Promise<void> {
//             // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
//             await cloudinary.uploader.upload_stream({
//             resource_type: "auto", // Automatically detect the file type
//             public_id: data.fileName, // Optional: Set a specific public ID for the file
//             folder: config.get("cloudinary.folder"), // Optional: Specify a folder for organization
//         } as UploadApiOptions)
//             // .end(data.fileData);

//     }

//     // async delete(fileName: string): Promise<void> {

//     //         const publicId = `${config.get<string>("cloudinary.folder")}/${fileName}`;
//     //         const result = await cloudinary.uploader.destroy(publicId);
//     //         if (result.result !== "ok") {
//     //             throw new Error(`Failed to delete file: ${fileName}`);
//     //         }
//     //         console.log(`File deleted successfully: ${fileName}`);

//     // }

//     getObject(fileName: string): string {
//         const folder = config.get<string>("cloudinary.folder");
//         const cloudName = config.get<string>("cloudinary.cloudName");
//         return `https://res.cloudinary.com/${cloudName}/image/upload/${folder}/${fileName}`;
//     }
// }
