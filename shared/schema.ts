import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (customers, vendors, and admins)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  isVendor: boolean("is_vendor").default(false).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  phone: text("phone"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Vendor profiles
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  storeName: text("store_name").notNull().unique(),
  description: text("description").notNull(),
  logoUrl: text("logo_url"),
  bannerColor: text("banner_color"),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  applicationStatus: text("application_status").default("pending").notNull(),
  applicationNotes: text("application_notes"),
  rating: doublePrecision("rating").default(0),
  reviewCount: integer("review_count").default(0),
  productCount: integer("product_count").default(0),
  verified: boolean("verified").default(false),
});

// Categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  slug: text("slug").notNull().unique(),
  iconName: text("icon_name").notNull(),
  iconColor: text("icon_color").notNull(),
  productCount: integer("product_count").default(0),
});

// Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").references(() => vendors.id).notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  comparePrice: doublePrecision("compare_price"),
  imageUrl: text("image_url").notNull(),
  rating: doublePrecision("rating").default(0),
  reviewCount: integer("review_count").default(0),
  inventory: integer("inventory").default(0),
  isNew: boolean("is_new").default(false),
  isTrending: boolean("is_trending").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cart
export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cart Items
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cart_id").references(() => carts.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").default(1).notNull(),
  price: doublePrecision("price").notNull(),
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  totalAmount: doublePrecision("total_amount").notNull(),
  status: text("status").notNull().default("pending"),
  shippingAddress: jsonb("shipping_address").notNull(),
  paymentMethod: text("payment_method").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Order Items
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  vendorId: integer("vendor_id").references(() => vendors.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: doublePrecision("price").notNull(),
});

// Reviews
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  vendorId: integer("vendor_id").references(() => vendors.id).notNull(),
  orderId: integer("order_id").references(() => orders.id),
  rating: integer("rating").notNull(),
  title: text("title"),
  comment: text("comment"),
  status: text("status").default("published").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Password Reset Tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Schema for Insert
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Vendor Schema for Insert
export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  userId: true,
  applicationStatus: true,
  applicationNotes: true,
  rating: true,
  reviewCount: true,
  productCount: true,
  verified: true,
});

// Category Schema for Insert
export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  productCount: true,
});

// Product Schema for Insert
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  rating: true,
  reviewCount: true,
  createdAt: true,
});

// Cart Schema for Insert
export const insertCartSchema = createInsertSchema(carts).omit({
  id: true,
  createdAt: true,
});

// Cart Item Schema for Insert
export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
});

// Order Schema for Insert
export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

// Order Item Schema for Insert
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

// Review Schema for Insert
export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

// Password Reset Token Schema for Insert
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Cart = typeof carts.$inferSelect;
export type InsertCart = z.infer<typeof insertCartSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
