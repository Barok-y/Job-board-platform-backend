import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) =>{
    try{
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith("Bearer ")){
            return res.status(401).json({
                error: "No token provided."
            });
        }

        const token = authHeader.split(" ")[1];
        if(!token){
            return res.status(401).json({
                error: "Invalid token format."
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        req.user = decoded;

        next();
    }catch(err){
        return res.status(403).json({
            error: "Unauthorized."
        })
    }
};

export default authMiddleware;