import { 
  users, User, InsertUser,
  vendors, Vendor, InsertVendor,
  categories, Category, InsertCategory,
  products, Product, InsertProduct,
  carts, Cart, InsertCart,
  cartItems, CartItem, InsertCartItem,
  orders, Order, InsertOrder,
  orderItems, OrderItem, InsertOrderItem
} from "@shared/schema";
import session from "express-session";
import { db, pool } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { IStorage } from "./storage";

const PostgresSessionStore = connectPg(session);

// Database implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }
  
  // Initialization method
  async initializeData(): Promise<void> {
    const categoriesToCreate: InsertCategory[] = [
      {
        name: "Fashion",
        description: "Clothes, shoes, and accessories",
        slug: "fashion",
        iconName: "shirt",
        iconColor: "#4F46E5"
      },
      {
        name: "Electronics",
        description: "Gadgets, computers, and accessories",
        slug: "electronics",
        iconName: "computer",
        iconColor: "#2563EB"
      },
      {
        name: "Home",
        description: "Furniture, decor, and kitchen items",
        slug: "home",
        iconName: "home",
        iconColor: "#059669"
      },
      {
        name: "Books",
        description: "Fiction, non-fiction, and educational",
        slug: "books",
        iconName: "book-open",
        iconColor: "#7C3AED"
      },
      {
        name: "Health",
        description: "Wellness, beauty, and personal care",
        slug: "health",
        iconName: "heart-pulse",
        iconColor: "#DC2626"
      },
      {
        name: "Toys",
        description: "Games, toys, and entertainment",
        slug: "toys",
        iconName: "gamepad-2",
        iconColor: "#F59E0B"
      }
    ];
    
    // Check if we need to create categories
    const existingCategories = await db.select().from(categories);
    if (existingCategories.length === 0) {
      console.log("Initializing categories...");
      for (const category of categoriesToCreate) {
        await this.createCategory(category);
      }
      
      // Create demo user and products
      await this.createDemoData();
    }
  }
  
  async createDemoData(): Promise<void> {
    console.log("Creating demo data...");
    
    // Create demo user - no need to hash password for the demo user
    // since we have a special case in auth.ts
    const demoUser: InsertUser = {
      username: "demo_vendor",
      email: "vendor@example.com",
      fullName: "Demo Vendor",
      password: "password", // Special case handling in auth.ts
      isVendor: true
    };
    
    // Check if demo user already exists
    const existingUser = await this.getUserByUsername(demoUser.username);
    if (existingUser) {
      return; // Demo data already exists, no need to create it again
    }
    
    const user = await this.createUser(demoUser);
    
    // Create vendors
    const vendorData: InsertVendor[] = [
      {
        userId: user.id,
        storeName: "TechGadgets",
        description: "The latest electronics and gadgets at affordable prices",
        contactEmail: "contact@techgadgets.com",
        logoUrl: "https://via.placeholder.com/200?text=TG",
        bannerColor: "from-blue-600 to-blue-400"
      },
      {
        userId: user.id,
        storeName: "Fashion Forward",
        description: "Trendy clothes and accessories for all seasons",
        contactEmail: "support@fashionforward.com",
        logoUrl: "https://via.placeholder.com/200?text=FF",
        bannerColor: "from-purple-600 to-purple-400"
      },
      {
        userId: user.id,
        storeName: "Home Harmony",
        description: "Beautiful furniture and decor for your home",
        contactEmail: "info@homeharmony.com",
        logoUrl: "https://via.placeholder.com/200?text=HH",
        bannerColor: "from-green-600 to-green-400"
      }
    ];
    
    const createdVendors: Vendor[] = [];
    for (const data of vendorData) {
      const vendor = await this.createVendor(data);
      
      // Update vendor fields not in the insertVendor schema
      await db.update(vendors)
        .set({
          rating: 4.5,
          reviewCount: 100,
          verified: true
        })
        .where(eq(vendors.id, vendor.id));
        
      const updatedVendor = await this.getVendor(vendor.id);
      if (updatedVendor) {
        createdVendors.push(updatedVendor);
      }
    }
    
    // Get categories
    const fashionCategory = await this.getCategoryBySlug("fashion");
    const electronicsCategory = await this.getCategoryBySlug("electronics");
    const homeCategory = await this.getCategoryBySlug("home");
    
    if (!fashionCategory || !electronicsCategory || !homeCategory) {
      console.error("Categories not found, cannot create products");
      return;
    }
    
    // Create products
    const productsData: InsertProduct[] = [
      // Electronics
      {
        name: "Wireless Bluetooth Headphones",
        description: "Premium sound quality with noise cancellation and 30-hour battery life",
        price: 129.99,
        comparePrice: 159.99,
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
        inventory: 25,
        categoryId: electronicsCategory.id,
        vendorId: createdVendors[0].id,
        isNew: true,
        isTrending: true
      },
      {
        name: "Smart Watch Series 5",
        description: "Track your fitness, monitor your health, and stay connected with this advanced smartwatch",
        price: 249.99,
        comparePrice: 299.99,
        imageUrl: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500",
        inventory: 12,
        categoryId: electronicsCategory.id,
        vendorId: createdVendors[0].id,
        isNew: true,
        isTrending: false
      },
      // Fashion
      {
        name: "Premium Leather Jacket",
        description: "Genuine leather jacket with modern design for a timeless look",
        price: 199.99,
        comparePrice: 249.99,
        imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500",
        inventory: 15,
        categoryId: fashionCategory.id,
        vendorId: createdVendors[1].id,
        isNew: false,
        isTrending: true
      },
      {
        name: "Casual Summer Dress",
        description: "Light, breathable fabric perfect for hot summer days",
        price: 59.99,
        comparePrice: 79.99,
        imageUrl: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=500",
        inventory: 30,
        categoryId: fashionCategory.id,
        vendorId: createdVendors[1].id,
        isNew: true,
        isTrending: true
      },
      // Home
      {
        name: "Modern Coffee Table",
        description: "Sleek design with durable materials perfect for any living room",
        price: 149.99,
        comparePrice: 199.99,
        imageUrl: "https://images.unsplash.com/photo-1499933374294-4584851497cc?w=500",
        inventory: 7,
        categoryId: homeCategory.id,
        vendorId: createdVendors[2].id,
        isNew: false,
        isTrending: false
      },
      {
        name: "Memory Foam Mattress - Queen",
        description: "Cloud-like comfort for the best sleep of your life with cooling technology",
        price: 599.99,
        comparePrice: 799.99,
        imageUrl: "https://images.unsplash.com/photo-1631157852824-10b68759173a?w=500",
        inventory: 5,
        categoryId: homeCategory.id,
        vendorId: createdVendors[2].id,
        isNew: true,
        isTrending: true
      }
    ];
    
    for (const productData of productsData) {
      const product = await this.createProduct(productData);
      
      // Update product ratings
      await db.update(products)
        .set({
          rating: 4.5,
          reviewCount: 50
        })
        .where(eq(products.id, product.id));
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  // Vendor methods
  async getVendor(id: number): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor;
  }
  
  async getVendorByUserId(userId: number): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.userId, userId));
    return vendor;
  }
  
  async getVendorByName(storeName: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.storeName, storeName));
    return vendor;
  }
  
  async getAllVendors(): Promise<Vendor[]> {
    return db.select().from(vendors);
  }
  
  async getFeaturedVendors(limit: number = 6): Promise<Vendor[]> {
    return db.select()
      .from(vendors)
      .where(and(
        sql`${vendors.productCount} > 0`,
        eq(vendors.verified, true)
      ))
      .limit(limit);
  }
  
  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const [newVendor] = await db.insert(vendors).values(vendor).returning();
    return newVendor;
  }
  
  async updateVendorProductCount(vendorId: number, increment: boolean): Promise<void> {
    const vendor = await this.getVendor(vendorId);
    if (!vendor) return;
    
    const currentCount = vendor.productCount || 0;
    const newCount = increment ? currentCount + 1 : Math.max(0, currentCount - 1);
    
    await db.update(vendors)
      .set({ productCount: newCount })
      .where(eq(vendors.id, vendorId));
  }
  
  // Category methods
  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }
  
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }
  
  async getAllCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }
  
  async updateCategoryProductCount(categoryId: number, increment: boolean): Promise<void> {
    const category = await this.getCategory(categoryId);
    if (!category) return;
    
    const currentCount = category.productCount || 0;
    const newCount = increment ? currentCount + 1 : Math.max(0, currentCount - 1);
    
    await db.update(categories)
      .set({ productCount: newCount })
      .where(eq(categories.id, categoryId));
  }
  
  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }
  
  async getProductsByVendor(vendorId: number): Promise<Product[]> {
    return db.select().from(products).where(eq(products.vendorId, vendorId));
  }
  
  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return db.select().from(products).where(eq(products.categoryId, categoryId));
  }
  
  async getNewProducts(limit: number = 10): Promise<Product[]> {
    return db.select()
      .from(products)
      .where(eq(products.isNew, true))
      .limit(limit);
  }
  
  async getTrendingProducts(limit: number = 10): Promise<Product[]> {
    return db.select()
      .from(products)
      .where(eq(products.isTrending, true))
      .limit(limit);
  }
  
  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    
    // Update counts
    await this.updateVendorProductCount(newProduct.vendorId, true);
    await this.updateCategoryProductCount(newProduct.categoryId, true);
    
    return newProduct;
  }
  
  // Cart methods
  async getCart(userId: number): Promise<{ cart: Cart, items: (CartItem & { product: Product })[] } | undefined> {
    const [cart] = await db.select().from(carts).where(eq(carts.userId, userId));
    
    if (!cart) return undefined;
    
    // Get cart items with product info
    const items = await db.select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cart.id));
    
    const itemsWithProducts: (CartItem & { product: Product })[] = [];
    
    for (const item of items) {
      const product = await this.getProduct(item.productId);
      if (product) {
        itemsWithProducts.push({ ...item, product });
      }
    }
    
    return { cart, items: itemsWithProducts };
  }
  
  async createCart(cart: InsertCart): Promise<Cart> {
    const [newCart] = await db.insert(carts).values(cart).returning();
    return newCart;
  }
  
  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    // Check if the item already exists in the cart
    const [existingItem] = await db.select()
      .from(cartItems)
      .where(and(
        eq(cartItems.cartId, cartItem.cartId),
        eq(cartItems.productId, cartItem.productId)
      ));
    
    if (existingItem) {
      // Update quantity instead of adding new item
      const updatedItem = await this.updateCartItem(
        existingItem.id, 
        existingItem.quantity + (cartItem.quantity || 1)
      );
      
      return updatedItem as CartItem;
    }
    
    const itemToAdd = {
      ...cartItem,
      quantity: cartItem.quantity || 1
    };
    
    const [newCartItem] = await db.insert(cartItems).values(itemToAdd).returning();
    return newCartItem;
  }
  
  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    if (quantity <= 0) {
      await this.removeCartItem(id);
      return undefined;
    }
    
    const [updatedItem] = await db.update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
      
    return updatedItem;
  }
  
  async removeCartItem(id: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }
  
  async clearCart(cartId: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  }
  
  // Order methods
  async createOrder(insertOrder: InsertOrder, items: Omit<InsertOrderItem, "orderId">[]): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    
    // Add order items
    for (const item of items) {
      await db.insert(orderItems).values({
        ...item,
        orderId: order.id
      });
    }
    
    return order;
  }
  
  async getOrdersByUser(userId: number): Promise<Order[]> {
    return db.select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }
  
  async getOrder(id: number): Promise<{ order: Order, items: (OrderItem & { product: Product })[] } | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    
    if (!order) return undefined;
    
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    
    const itemsWithProducts: (OrderItem & { product: Product })[] = [];
    
    for (const item of items) {
      const product = await this.getProduct(item.productId);
      if (product) {
        itemsWithProducts.push({ ...item, product });
      }
    }
    
    return { order, items: itemsWithProducts };
  }
}