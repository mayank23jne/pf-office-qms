import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "default_secret";

export const generateToken = (payload: any) => {
  return jwt.sign(payload, SECRET, { expiresIn: "12h" });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    return null;
  }
};
