import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Validate header and Bearer format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    // Validate token existence
    if (!token) {
      return res.status(401).json({
        error: "Invalid token format.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Attach user to request
    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      error: "Unauthorized.",
    });
  }
};

export default authMiddleware;