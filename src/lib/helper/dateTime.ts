import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/id";

// --- Configure Day.js
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("id");
const TIMEZONE = process.env.TIMEZONE || "Asia/Jakarta";

/**
 * ✅ Convert date to formatted string (DD/MM/YYYY HH:mm:ss)
 */
export function ConvertDateTime(date: Date | string | null): string | null {
    if (!date || date.toString() === "Invalid Date") return null;
    return dayjs(date).tz(TIMEZONE).format("DD/MM/YYYY HH:mm:ss");
}

/**
 * ✅ Get current timestamp in YYYYMMDDHHmmss format
 */
export function GetTimestamp(): string {
    return dayjs().tz(TIMEZONE).format("YYYYMMDDHHmmss");
}