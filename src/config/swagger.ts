import swaggerJSDoc from "swagger-jsdoc";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Wohnee API v1",
            version: "1.0.0",
            description: "Wohnee API v1 Documentation (JWT + Signature Authentication)",
            contact: {
                name: "Ngodingin.org",
                email: "support@ngodingin.org",
            },
        },
        servers: [
            {
                url: "https://api-wohnee.ngodingin.org/api/v1",
                description: "Production Server",
            },
            {
                url: "http://localhost:3000/api/v1",
                description: "Local Development",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
                XSignatureAuth: {
                    type: "apiKey",
                    in: "header",
                    name: "X-Signature",
                    description: "HMAC-SHA256 signature for request validation",
                },
                XDateHeader: {
                    type: "apiKey",
                    in: "header",
                    name: "X-Date",
                    description: "ISO 8601 timestamp used for signature validation",
                },
            },
        },
        security: [
            {
                bearerAuth: [],
                XSignatureAuth: [],
                XDateHeader: [],
            },
        ],
    },
    apis: ["./src/app/module/**/*.ts"], // Paths to your route files
};

export const swaggerSpec = swaggerJSDoc(options);