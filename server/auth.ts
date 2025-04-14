import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

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

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "qyuqa-marketplace-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false);
        }
        
        // Special case for demo user - allow login with any password
        if (username === "demo_vendor") {
          return done(null, user);
        }
        
        // Normal password check for regular users
        if (user.password.includes('.')) {
          // Properly hashed password
          if (!(await comparePasswords(password, user.password))) {
            return done(null, false);
          }
        } else {
          // Plain text password (should never happen in production)
          if (password !== user.password) {
            return done(null, false);
          }
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUsername = await storage.getUserByUsername(req.body.username);
      if (existingUsername) {
        return res.status(400).send("Username already exists");
      }
      
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).send("Email already exists");
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    console.log("Logout request received");
    console.log("Is authenticated before logout:", req.isAuthenticated());
    console.log("Session ID:", req.sessionID);
    console.log("Session data:", req.session);
    
    if (!req.isAuthenticated()) {
      console.log("User was not authenticated, returning 200 anyway");
      return res.status(200).json({ message: "Not logged in" });
    }
    
    // First save the user info for logging
    const userId = req.user?.id;
    const username = req.user?.username;
    
    // Perform logout
    req.logout(function(err) {
      if (err) {
        console.error("Error in logout:", err);
        return next(err);
      }
      
      // Then destroy the session
      if (req.session) {
        req.session.destroy(function(err) {
          if (err) {
            console.error("Error destroying session:", err);
            return next(err);
          }
          
          // Clear cookie
          res.clearCookie('connect.sid', { 
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
          });
          
          console.log(`User ${username} (ID: ${userId}) successfully logged out`);
          console.log("Is authenticated after logout:", req.isAuthenticated());
          
          return res.status(200).json({ success: true, message: "Logged out successfully" });
        });
      } else {
        console.log("No session to destroy");
        // Clear cookie anyway
        res.clearCookie('connect.sid', { 
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
        
        return res.status(200).json({ success: true, message: "Logged out successfully (no session)" });
      }
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Check if user is a vendor
  app.get("/api/user/vendor", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
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
