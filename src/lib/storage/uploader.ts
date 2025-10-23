import {promises as fs} from "fs";
import {join} from "path";
import {GetTimestamp} from "../helper/dateTime";
import {S3Client, PutObjectCommand} from "@aws-sdk/client-s3";
import {Storage} from "@google-cloud/storage";

type UploadedFile = {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
};

// --- ENV configuration ---
const STORAGE_TYPE = (process.env.STORAGE || "local").toLowerCase();
const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || "files/images";

// --- Normalize path for Windows compatibility ---
const normalizePath = (filePath: string): string => filePath.replace(/\\+/g, "/");

/**
 * ✅ Upload file to appropriate storage provider
 */
export const UploadFile = async (file: UploadedFile): Promise<string> => {
    switch (STORAGE_TYPE) {
        case "s3":
            return await UploadToS3(file);
        case "gcs":
            return await UploadToGCS(file);
        default:
            return await UploadToLocal(file);
    }
};

/**
 * ✅ Upload to AWS S3
 */
export const UploadToS3 = async (file: UploadedFile): Promise<string> => {
    if (
        !process.env.AWS_S3_BUCKET ||
        !process.env.AWS_S3_REGION ||
        !process.env.AWS_ACCESS_KEY_ID ||
        !process.env.AWS_SECRET_ACCESS_KEY
    ) {
        throw new Error("❌ Missing AWS S3 configuration in environment variables.");
    }

    const s3 = new S3Client({
        region: process.env.AWS_S3_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });

    const timestamp = await GetTimestamp();
    const newFilename = `${timestamp}_${file.originalname}`;

    try {
        await s3.send(
            new PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: newFilename,
                Body: file.buffer,
                ContentType: file.mimetype,
                ACL: "public-read", // optional
            })
        );

        const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${newFilename}`;
        console.log(`[S3] ✅ Uploaded: ${url}`);
        return url;
    } catch (error) {
        console.error("[S3] ❌ Upload failed:", error);
        throw new Error("Failed to upload file to S3");
    }
};

/**
 * ✅ Upload to Google Cloud Storage (GCS)
 */
export const UploadToGCS = async (file: UploadedFile): Promise<string> => {
    if (
        !process.env.GCS_BUCKET ||
        !process.env.GOOGLE_APPLICATION_CREDENTIALS
    ) {
        throw new Error("❌ Missing Google Cloud Storage configuration in environment variables.");
    }

    const storage = new Storage({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        projectId: process.env.GCS_PROJECT_ID,
    });

    const bucket = storage.bucket(process.env.GCS_BUCKET);
    const timestamp = await GetTimestamp();
    const newFilename = `${timestamp}_${file.originalname}`;
    const fileRef = bucket.file(newFilename);

    try {
        await fileRef.save(file.buffer, {
            metadata: {contentType: file.mimetype},
            resumable: false,
            public: true,
        });

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${newFilename}`;
        console.log(`[GCS] ✅ Uploaded: ${publicUrl}`);
        return publicUrl;
    } catch (error) {
        console.error("[GCS] ❌ Upload failed:", error);
        throw new Error("Failed to upload file to GCS");
    }
};

/**
 * ✅ Upload to Local Storage
 */
export const UploadToLocal = async (file: UploadedFile): Promise<string> => {
    const timestamp = await GetTimestamp();
    const newFilename = `${timestamp}_${file.originalname}`;
    const destinationPath = join(LOCAL_STORAGE_PATH, newFilename);

    await fs.mkdir(LOCAL_STORAGE_PATH, {recursive: true});
    const normalizedPath = normalizePath(destinationPath);
    await fs.writeFile(normalizedPath, file.buffer);

    console.log(`[LOCAL] ✅ File saved to ${normalizedPath}`);
    return normalizedPath;
};

/**
 * ✅ Get file from local storage
 */
export const GetFileFromLocal = async (filename: string): Promise<Buffer | null> => {
    try {
        const filePath = join(LOCAL_STORAGE_PATH, filename);
        const normalizedPath = normalizePath(filePath);
        return await fs.readFile(normalizedPath);
    } catch (error) {
        console.error(`[LOCAL] ❌ Error reading file: ${error}`);
        return null;
    }
};