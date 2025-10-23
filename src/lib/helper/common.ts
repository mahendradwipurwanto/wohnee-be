/**
 * ✅ Generate a random number of a specific length (e.g., 4 or 6 digits)
 */
export async function GenerateRandomNumber(length: number): Promise<number> {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * ✅ Get safe image URL (auto fallback if missing)
 */
export function checkPicturePath(picture?: string | null): string {
    if (!picture) {
        return "https://ui-avatars.com/api/?background=random&name=User";
    }

    if (picture.includes("storage.googleapis.com")) {
        return picture;
    }

    const HOST = process.env.STORAGE_LOCAL_HOST || "http://localhost:3000";
    const PATH = process.env.STORAGE_LOCAL_PATH || "/files/images/";

    return process.env.STORAGE === "local" ? `${HOST}${PATH}${picture}` : picture;
}