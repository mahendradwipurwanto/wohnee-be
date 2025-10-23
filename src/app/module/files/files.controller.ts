import {Router, Request, Response, NextFunction} from "express";
import {LimiterMiddleware} from "../../middleware/limiter.middleware";
import {CustomHttpExceptionError} from "../../../lib/helper/errorHandler";
import {GetFileFromLocal} from "../../../lib/storage/uploader";
import fs from "fs";
import mime from "mime-types";
import loggerHandler from "../../../lib/helper/loggerHandler";

export class FilesController {
    public router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    /**
     * ✅ Initialize routes for file access
     */
    private initializeRoutes() {
        // Apply lightweight limiter: 10 requests / 5 seconds per IP
        this.router.get(
            "/images/:name",
            LimiterMiddleware(5 * 1000, 10),
            this.getFile
        );
    }

    /**
     * ✅ Serve static image files safely with dynamic content-type detection.
     */
    private getFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const filename = req.params.name?.trim();
            if (!filename) {
                throw new CustomHttpExceptionError("Filename is required", 400);
            }

            // Prevent directory traversal (e.g., ../../../etc/passwd)
            if (filename.includes("..") || filename.includes("/")) {
                throw new CustomHttpExceptionError("Invalid filename", 400);
            }

            // Resolve and verify file path
            const filePath = await GetFileFromLocal(filename);
            if (!filePath || !fs.existsSync(filePath)) {
                throw new CustomHttpExceptionError("File not found", 404);
            }

            // Detect content type dynamically
            const contentType = mime.lookup(filePath) || "application/octet-stream";
            res.setHeader("Content-Type", contentType);
            res.setHeader("Cache-Control", "public, max-age=86400"); // Cache 24h for images

            // Stream file for better performance
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);

            loggerHandler.debug(`[FILES] ✅ Served ${filename} (${contentType})`);
        } catch (error: any) {
            loggerHandler.warn(`[FILES] ⚠️ Failed to serve file: ${req.params.name} (${error.message})`);
            next(error instanceof CustomHttpExceptionError
                ? error
                : new CustomHttpExceptionError("Unable to fetch file", 500)
            );
        }
    };
}