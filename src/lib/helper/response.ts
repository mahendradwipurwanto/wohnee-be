import {RESPONSE_FAILED_DESC, RESPONSE_SUCCESS_DESC} from "../types/constanst/response";
import {ResponsePayload} from "../types/response";
import {CustomHttpExceptionError} from "./errorHandler";
import {Response} from "express";

/**
 * ✅ Build a standardized success response
 */
export function ResponseSuccessBuilder<T>(
    res: Response,
    statusCode: number,
    message = "Success",
    data?: T | null
): void {
    sendResponse(res, RESPONSE_SUCCESS_DESC, statusCode, message, data);
}

/**
 * ✅ Build a standardized error response
 */
export function ResponseErrorBuilder(
    res: Response,
    err: unknown
): void {
    let error: CustomHttpExceptionError;

    // --- Normalize unknown error types
    if (err instanceof CustomHttpExceptionError) {
        error = err;
    } else if (err && typeof err === "object" && "statusCode" in err) {
        error = err as CustomHttpExceptionError;
    } else {
        error = new CustomHttpExceptionError("Internal Server Error", 500, err as Error);
    }

    const {statusCode, message, detailError} = error;
    const errMessage = detailError?.message ?? null;

    sendResponse(res, RESPONSE_FAILED_DESC, statusCode, message, errMessage);
}

/**
 * ✅ Shared internal function to structure all responses
 */
function sendResponse<T>(
    res: Response,
    desc: string,
    statusCode: number,
    message: string,
    data?: T | null
): void {
    const payload: ResponsePayload = {
        responseCode: statusCode,
        responseDesc: desc,
        message,
        data: isEmptyObject(data) ? null : data ?? null,
    };

    res.status(statusCode).json(payload);
}

/**
 * ✅ Utility to detect empty objects
 */
function isEmptyObject(value: unknown): boolean {
    return (
        typeof value === "object" &&
        value !== null &&
        Object.keys(value).length === 0 &&
        value.constructor === Object
    );
}