// Debug route to add to server/routes.ts
// Add this at the end of the file, just before the registerRoutes return statement

  // Debug routes
  app.get("/api/debug/user/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ 
        id: user.id,
        username: user.username,
        isVendor: user.isVendor,
        isAdmin: user.isAdmin
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });