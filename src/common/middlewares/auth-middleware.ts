import { expressjwt, GetVerificationKey } from "express-jwt"; // Import express-jwt for JWT middleware
import { Request } from "express"; // Import Request type from express
import jwksClient from "jwks-rsa"; // Import jwks-rsa for fetching JSON Web Key Sets
import config from "config"; // Import config for fetching JWKS URI
import { AuthCookie } from "../types";

// Export the configured expressjwt middleware
export default expressjwt({
    // Configure the secret using jwksClient to fetch the signing key
    secret: jwksClient.expressJwtSecret({
        jwksUri: config.get("auth.jwksUri"), // URI to fetch the JWKS
        cache: true, // Enable caching of the keys
        rateLimit: true, // Enable rate limiting for key requests
    }) as GetVerificationKey, // Cast to GetVerificationKey type
    algorithms: ["RS256"], // Specify the algorithm used for signing the JWT

    // Function to extract the token from the request
    getToken(req: Request) {
        const authHeader = req.headers.authorization; // Get the Authorization header

        // Check if the Authorization header exists and is not 'undefined'
        if (authHeader && authHeader.split(" ")[1] !== "undefined") {
            const token = authHeader.split(" ")[1]; // Extract the token from 'Bearer <token>'
            if (token) {
                return token; // Return the token if it exists
            }
        }

        // Fallback to retrieve the token from cookies if not found in the header
        const { accessToken } = req.cookies as AuthCookie; // Get accessToken from cookies
        return accessToken; // Return the accessToken from cookies
    },
});
