import fs from "fs";
import path from "path";
import { createLogger, format, transports, Logger } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

// --- Determine environment
const isProduction = process.env.NODE_ENV === "production";

// --- Log directory setup (used only in non-production)
const logDir = path.resolve(process.env.LOG_PATH || "logs");

if (!isProduction) {
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
}

// --- Define base log format
const logFormat = format.printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

// --- Winston logger configuration
const logger = createLogger({
    level: isProduction ? "info" : "debug",
    format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.errors({ stack: true }),
        logFormat
    ),
    transports: [
        // --- Always log to console
        new transports.Console({
            format: format.combine(
                format.colorize({ all: !isProduction }),
                logFormat
            ),
        }),

        // --- Write rotating files only in non-production
        ...(isProduction
            ? []
            : [
                new DailyRotateFile({
                    dirname: logDir,
                    filename: "app-%DATE%.log",
                    datePattern: "YYYY-MM-DD",
                    zippedArchive: true,
                    maxSize: "20m",
                    maxFiles: "14d",
                    level: "info",
                }),
                new DailyRotateFile({
                    dirname: logDir,
                    filename: "error-%DATE%.log",
                    datePattern: "YYYY-MM-DD",
                    zippedArchive: true,
                    maxSize: "20m",
                    maxFiles: "30d",
                    level: "error",
                }),
            ]),
    ],
});

// ✅ Optional: Stream interface for HTTP request logging (morgan integration)
(logger as Logger & {
    httpStream: { write: (message: string) => void };
}).httpStream = {
    write: (message: string) => {
        logger.info(message.trim());
    },
};

export default logger;