import "winston";

declare module "winston" {
    interface Logger {
        stream: { write: (message: string) => void };
    }
}