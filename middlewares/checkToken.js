const jwt = require("jsonwebtoken");
exports.userAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(499).json({ message: "Token is required" });
    }
    jwt.verify(
      token.split(" ")[1],
      process.env.TOKEN_SECRET,
      (err, decoded) => {
        if (err) {
          return res.status(498).json({ error: err.message });
        }
        req.user = { _id: decoded._id };
        next();
      }
    );
  } catch (e) {
    return res.status(500).json({ message: "Something went wrong", error: e });
  }
};
