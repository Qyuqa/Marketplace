import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertVendorSchema, insertProductSchema, insertCartItemSchema, insertOrderSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:slug", async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Vendors
  app.get("/api/vendors", async (req, res) => {
    try {
      const vendors = await storage.getAllVendors();
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });

  app.get("/api/vendors/featured", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const vendors = await storage.getFeaturedVendors(limit);
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured vendors" });
    }
  });

  app.get("/api/vendors/:id", async (req, res) => {
    try {
      const vendor = await storage.getVendor(parseInt(req.params.id));
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      res.json(vendor);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vendor" });
    }
  });

  app.post("/api/vendors", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Check if user is already a vendor
      const existingVendor = await storage.getVendorByUserId(req.user.id);
      if (existingVendor) {
        return res.status(400).json({ message: "User already has a vendor profile" });
      }

      const validatedData = insertVendorSchema.parse(req.body);
      const vendor = await storage.createVendor({
        ...validatedData,
        userId: req.user.id,
      });

      // Update user to be a vendor
      const user = await storage.getUser(req.user.id);
      if (user) {
        user.isVendor = true;
        req.login(user, (err) => {
          if (err) throw err;
        });
      }

      res.status(201).json(vendor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create vendor" });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      let products = [];
      
      if (req.query.category) {
        const category = await storage.getCategoryBySlug(req.query.category as string);
        if (category) {
          products = await storage.getProductsByCategory(category.id);
        }
      } else if (req.query.vendor) {
        products = await storage.getProductsByVendor(parseInt(req.query.vendor as string));
      } else if (req.query.new === 'true') {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
        products = await storage.getNewProducts(limit);
      } else if (req.query.trending === 'true') {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
        products = await storage.getTrendingProducts(limit);
      } else {
        // Return all products - in a real app, you'd want pagination here
        const allCategories = await storage.getAllCategories();
        for (const category of allCategories) {
          const categoryProducts = await storage.getProductsByCategory(category.id);
          products = [...products, ...categoryProducts];
        }
      }
      
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(parseInt(req.params.id));
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Get vendor info as well
      const vendor = await storage.getVendor(product.vendorId);
      res.json({ product, vendor });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Get vendor by user ID
      const vendor = await storage.getVendorByUserId(req.user.id);
      if (!vendor) {
        return res.status(403).json({ message: "User is not a vendor" });
      }

      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct({
        ...validatedData,
        vendorId: vendor.id,
      });

      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Cart
  app.get("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      let cart = await storage.getCart(req.user.id);
      
      if (!cart) {
        // Create a new cart if one doesn't exist
        const newCart = await storage.createCart({ userId: req.user.id });
        cart = { cart: newCart, items: [] };
      }
      
      res.json(cart);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart/items", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      let cart = await storage.getCart(req.user.id);
      
      if (!cart) {
        // Create a new cart if one doesn't exist
        const newCart = await storage.createCart({ userId: req.user.id });
        cart = { cart: newCart, items: [] };
      }
      
      const validatedData = insertCartItemSchema.parse({
        ...req.body,
        cartId: cart.cart.id
      });
      
      // Fetch product to get current price
      const product = await storage.getProduct(validatedData.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Set the price from the product
      validatedData.price = product.price;
      
      const cartItem = await storage.addToCart(validatedData);
      
      // Get updated cart
      const updatedCart = await storage.getCart(req.user.id);
      res.status(201).json(updatedCart);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  app.put("/api/cart/items/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const itemId = parseInt(req.params.id);
      const quantity = parseInt(req.body.quantity);
      
      await storage.updateCartItem(itemId, quantity);
      
      // Get updated cart
      const updatedCart = await storage.getCart(req.user.id);
      res.json(updatedCart);
    } catch (error) {
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/items/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const itemId = parseInt(req.params.id);
      
      await storage.removeCartItem(itemId);
      
      // Get updated cart
      const updatedCart = await storage.getCart(req.user.id);
      res.json(updatedCart);
    } catch (error) {
      res.status(500).json({ message: "Failed to remove cart item" });
    }
  });

  app.delete("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      let cart = await storage.getCart(req.user.id);
      
      if (cart) {
        await storage.clearCart(cart.cart.id);
      }
      
      // Get updated cart
      const updatedCart = await storage.getCart(req.user.id);
      res.json(updatedCart);
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Orders
  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const cart = await storage.getCart(req.user.id);
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }
      
      const validatedData = insertOrderSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      
      // Calculate total amount
      const totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      validatedData.totalAmount = totalAmount;
      
      // Create order items
      const orderItems = cart.items.map(item => ({
        productId: item.productId,
        vendorId: item.product.vendorId,
        quantity: item.quantity,
        price: item.price
      }));
      
      const order = await storage.createOrder(validatedData, orderItems);
      
      // Clear the cart
      await storage.clearCart(cart.cart.id);
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const orders = await storage.getOrdersByUser(req.user.id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Check if the order belongs to the user
      if (order.order.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
