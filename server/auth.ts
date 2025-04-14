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
  try {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.error("Invalid password format, missing hash or salt");
      return false;
    }
    
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    
    console.log(`Comparing passwords for hash length: ${hashedBuf.length}`);
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "qyuqa-marketplace-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    name: 'qyuqa.sid', // Custom cookie name to make it easier to identify
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
      path: '/', // Cookie is available for all paths
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      sameSite: 'lax' // Allows better cross-site navigation
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
        if (user.password === 'password.salt') {
          // Special case for demo data - consider anything with password.salt to be demo data
          if (password === 'password') {
            return done(null, user);
          } else {
            return done(null, false);
          }
        } else if (user.password.includes('.')) {
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

  // DIRECT HTML LOGOUT HANDLER
  // This is a special endpoint that generates a standalone HTML page
  // to destroy all sessions more aggressively
  app.get("/force-logout", (req, res) => {
    // Create a dedicated HTML page for logout
    const logoutHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Logging out...</title>
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          text-align: center;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-left-color: #000;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="spinner"></div>
      <h2>Logging out...</h2>
      <p>Please wait while we log you out of your account.</p>
      <script>
        // Client-side logout
        function clearClientState() {
          // Clear localStorage
          try { localStorage.clear(); } catch(e) { console.error(e); }
          
          // Clear sessionStorage  
          try { sessionStorage.clear(); } catch(e) { console.error(e); }
          
          // Clear all cookies
          document.cookie.split(";").forEach(function(c) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
          });
          
          // Special delete for connect.sid
          document.cookie = "connect.sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        }
        
        // Server-side logout
        fetch('/api/logout-action', { 
          method: 'POST',
          credentials: 'include'
        }).finally(() => {
          // Clear client state regardless of server response
          clearClientState();
          
          // Add some delay for user experience
          setTimeout(() => {
            window.location.href = '/?nocache=' + Date.now();
          }, 1500);
        });
      </script>
    </body>
    </html>
    `;
    
    // Send the HTML directly
    res.status(200).send(logoutHtml);
  });
  
  // Separate API endpoint for the actual server-side logout action
  app.post("/api/logout-action", (req, res, next) => {
    console.log("Nuclear logout action initiated");
    
    // First logout the user
    req.logout((err) => {
      if (err) {
        console.error("Error during req.logout:", err);
        return next(err);
      }
      
      // Then completely destroy the session
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          console.error("Error destroying session:", sessionErr);
        }
        
        // Clear the cookie by setting an expired cookie with multiple approaches
        res.clearCookie('connect.sid');
        
        // More aggressive cookie clearing with various domain options
        res.clearCookie('connect.sid', { path: '/' });
        res.clearCookie('connect.sid', { path: '/', domain: req.hostname });
        
        // Set max-age to 0 to immediately expire
        res.cookie('connect.sid', '', { 
          maxAge: 0,
          expires: new Date(0),
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        
        console.log("Session destroyed and cookies cleared");
        res.sendStatus(200);
      });
    });
  });
  
  // Keep the original endpoint for backward compatibility
  app.post("/api/logout", (req, res, next) => {
    console.log("Regular logout initiated - using nuclear approach");
    
    // First logout the user
    req.logout((err) => {
      if (err) {
        console.error("Error during req.logout:", err);
        return next(err);
      }
      
      // Then completely destroy the session
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          console.error("Error destroying session:", sessionErr);
        }
        
        // Clear the cookie by setting an expired cookie with multiple approaches
        res.clearCookie('connect.sid');
        
        // More aggressive cookie clearing with various domain options
        res.clearCookie('connect.sid', { path: '/' });
        res.clearCookie('connect.sid', { path: '/', domain: req.hostname });
        
        // Set max-age to 0 to immediately expire
        res.cookie('connect.sid', '', { 
          maxAge: 0,
          expires: new Date(0),
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        
        console.log("Session destroyed and cookies cleared");
        res.sendStatus(200);
      });
    });
  });

  // Add a route that checks if user is authenticated with more debugging
  app.get("/api/check-session", (req, res) => {
    const sessionId = req.sessionID;
    const hasSession = !!req.session;
    const isAuthenticated = req.isAuthenticated();
    const cookies = req.headers.cookie;
    
    console.log("Session check:", { 
      sessionId: sessionId ? "exists" : "missing", 
      hasSession, 
      isAuthenticated,
      hasCookies: !!cookies
    });
    
    if (isAuthenticated) {
      return res.json({ 
        authenticated: true, 
        hasSession: true,
        userId: req.user?.id
      });
    } else {
      return res.json({ 
        authenticated: false, 
        hasSession: hasSession
      });
    }
  });

  app.get("/api/user", (req, res) => {
    // Console log to help with debugging
    if (req.query.debug) {
      console.log("Session ID:", req.sessionID);
      console.log("Is authenticated:", req.isAuthenticated());
      console.log("Has cookie header:", !!req.headers.cookie);
    }
    
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
