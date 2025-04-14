import jwt from "jsonwebtoken";
import { Request, Response, NextFunction, Express } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

const scryptAsync = promisify(scrypt);

// Set a JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || "qyuqa-marketplace-jwt-secret";
// Token expiration time (7 days)
const TOKEN_EXPIRATION = '7d';

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Generate JWT token
export function generateToken(user: SelectUser) {
  // Create a cleaned user object without password
  const tokenUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin,
    isVendor: user.isVendor
  };
  
  return jwt.sign(tokenUser, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
}

// Verify JWT token
export function verifyToken(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
}

// Auth middleware
// Add type augmentation to express for user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }
  
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2) {
    return res.status(401).json({ message: "Token error" });
  }
  
  const [scheme, token] = parts;
  
  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ message: "Token malformatted" });
  }
  
  verifyToken(token)
    .then(decoded => {
      req.user = decoded;
      next();
    })
    .catch(() => res.status(401).json({ message: "Invalid token" }));
}

// Setup auth routes
export function setupJwtAuth(app: Express) {
  // Register endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUsername = await storage.getUserByUsername(req.body.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      // Generate token
      const token = generateToken(user);
      
      // Return user info and token
      res.status(201).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          isAdmin: user.isAdmin,
          isVendor: user.isVendor,
          createdAt: user.createdAt
        },
        token
      });
    } catch (error) {
      next(error);
    }
  });

  // Login endpoint
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Special case for demo user
      let isValidPassword = username === "demo_vendor";
      
      // Normal password check for regular users
      if (!isValidPassword) {
        if (user.password.includes('.')) {
          // Properly hashed password
          isValidPassword = await comparePasswords(password, user.password);
        } else {
          // Plain text password (should never happen in production)
          isValidPassword = password === user.password;
        }
      }
      
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Generate token
      const token = generateToken(user);
      
      // Return user info and token
      res.status(200).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          isAdmin: user.isAdmin,
          isVendor: user.isVendor,
          createdAt: user.createdAt
        },
        token
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get current user endpoint
  app.get("/api/user", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Check if user is a vendor
  app.get("/api/user/vendor", requireAuth, async (req, res) => {
    try {
      const vendor = await storage.getVendorByUserId(req.user.id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor profile not found" });
      }
      res.json(vendor);
    } catch (error) {
      res.status(500).json({ message: "Failed to get vendor profile" });
    }
  });
}

// Verify admin middleware
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: "Access denied. Admin rights required." });
  }
  next();
}

// Verify vendor middleware
export function isVendor(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.isVendor) {
    return res.status(403).json({ message: "Access denied. Vendor rights required." });
  }
  next();
}