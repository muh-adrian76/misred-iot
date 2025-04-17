import { JWT } from "./interface";

export async function authorizeRequest(req: JWT) {
    console.log("Headers received: ", req.headers);
    const { jwt, error, headers } = req;
    if (!headers || typeof headers.authorization !== "string") {
      throw new Error("Authorization header missing or invalid");
    }
  
    const authHeader = headers["authorization"];
    const token = authHeader.split(" ")[1];
    const authorize = await jwt.verify(token);
  
    try {
      if (!authorize) return error(401, "Unauthorized");
      return authorize; 
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        try {
          const response = await fetch(`http://localhost:7600/renew/${authorize.sub}`);
          const { accessToken } = await response.json(); 
  
          if (!accessToken) {
            throw new Error('Unable to refresh access token');
          }
  
          return { accessToken };
        } catch (error) {
          throw new Error('Invalid or expired refresh token');
        }
      }
    }
  }
  