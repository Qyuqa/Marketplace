import { 
  users, User, InsertUser,
  vendors, Vendor, InsertVendor,
  categories, Category, InsertCategory,
  products, Product, InsertProduct,
  carts, Cart, InsertCart,
  cartItems, CartItem, InsertCartItem,
  orders, Order, InsertOrder,
  orderItems, OrderItem, InsertOrderItem,
  reviews, Review, InsertReview
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Vendor operations
  getVendor(id: number): Promise<Vendor | undefined>;
  getVendorByUserId(userId: number): Promise<Vendor | undefined>;
  getVendorByName(storeName: string): Promise<Vendor | undefined>;
  getAllVendors(): Promise<Vendor[]>;
  getFeaturedVendors(limit?: number): Promise<Vendor[]>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendorProductCount(vendorId: number, increment: boolean): Promise<void>;
  
  // Category operations
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  getAllCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategoryProductCount(categoryId: number, increment: boolean): Promise<void>;
  
  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  getProductsByVendor(vendorId: number): Promise<Product[]>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  getNewProducts(limit?: number): Promise<Product[]>;
  getTrendingProducts(limit?: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  // Cart operations
  getCart(userId: number): Promise<{ cart: Cart, items: (CartItem & { product: Product })[] } | undefined>;
  createCart(cart: InsertCart): Promise<Cart>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  removeCartItem(id: number): Promise<void>;
  clearCart(cartId: number): Promise<void>;
  
  // Order operations
  createOrder(order: InsertOrder, items: Omit<InsertOrderItem, "orderId">[]): Promise<Order>;
  getOrdersByUser(userId: number): Promise<Order[]>;
  getOrder(id: number): Promise<{ order: Order, items: (OrderItem & { product: Product })[] } | undefined>;
  
  // Review operations
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByProduct(productId: number): Promise<Review[]>;
  getReviewsByUser(userId: number): Promise<Review[]>;
  getReviewsByVendor(vendorId: number): Promise<Review[]>;
  updateProductRating(productId: number): Promise<void>;
  updateVendorRating(vendorId: number): Promise<void>;
  
  // Session store
  sessionStore: session.Store;
  
  // Initialize data if needed
  initializeData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private vendors: Map<number, Vendor>;
  private categories: Map<number, Category>;
  private products: Map<number, Product>;
  private carts: Map<number, Cart>;
  private cartItems: Map<number, CartItem>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  
  currentUserId: number;
  currentVendorId: number;
  currentCategoryId: number;
  currentProductId: number;
  currentCartId: number;
  currentCartItemId: number;
  currentOrderId: number;
  currentOrderItemId: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.vendors = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.carts = new Map();
    this.cartItems = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    
    this.currentUserId = 1;
    this.currentVendorId = 1;
    this.currentCategoryId = 1;
    this.currentProductId = 1;
    this.currentCartId = 1;
    this.currentCartItemId = 1;
    this.currentOrderId = 1;
    this.currentOrderItemId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }
  
  // Initialize data method (for compatibility with database storage)
  async initializeData(): Promise<void> {
    await this.initializeCategories();
  }
  
  // Initialize seed data
  private initializeCategories() {
    const categories: InsertCategory[] = [
      {
        name: "Fashion",
        description: "Clothes, shoes, and accessories",
        slug: "fashion",
        iconName: "shirt",
        iconColor: "#4F46E5",
      },
      {
        name: "Electronics",
        description: "Gadgets, computers, and accessories",
        slug: "electronics",
        iconName: "computer",
        iconColor: "#2563EB",
      },
      {
        name: "Home",
        description: "Furniture, decor, and kitchen items",
        slug: "home",
        iconName: "home",
        iconColor: "#059669",
      },
      {
        name: "Books",
        description: "Fiction, non-fiction, and educational",
        slug: "books",
        iconName: "book-open",
        iconColor: "#7C3AED",
      },
      {
        name: "Health",
        description: "Wellness, beauty, and personal care",
        slug: "health",
        iconName: "heart-pulse",
        iconColor: "#DC2626",
      },
      {
        name: "Toys",
        description: "Games, toys, and entertainment",
        slug: "toys",
        iconName: "gamepad-2",
        iconColor: "#F59E0B",
      },
    ];
    
    categories.forEach((category) => {
      this.createCategory(category);
    });

    // Initialize demo vendors and products
    this.initializeDemoData();
  }

  private async initializeDemoData() {
    // Create demo user
    const demoUser: InsertUser = {
      username: "demo_vendor",
      email: "vendor@example.com",
      fullName: "Demo Vendor",
      password: "password.salt", // This would normally be hashed
      isVendor: true
    };
    const user = await this.createUser(demoUser);

    // Create demo vendors
    const vendors: InsertVendor[] = [
      {
        userId: user.id,
        storeName: "TechGadgets",
        description: "The latest electronics and gadgets at affordable prices",
        contactEmail: "contact@techgadgets.com",
        logoUrl: "https://via.placeholder.com/200?text=TG",
        bannerColor: "from-blue-600 to-blue-400",
        rating: 4.8,
        reviewCount: 120,
        verified: true
      },
      {
        userId: user.id,
        storeName: "Fashion Forward",
        description: "Trendy clothes and accessories for all seasons",
        contactEmail: "support@fashionforward.com",
        logoUrl: "https://via.placeholder.com/200?text=FF",
        bannerColor: "from-purple-600 to-purple-400",
        rating: 4.6,
        reviewCount: 85,
        verified: true
      },
      {
        userId: user.id,
        storeName: "Home Harmony",
        description: "Beautiful furniture and decor for your home",
        contactEmail: "info@homeharmony.com",
        logoUrl: "https://via.placeholder.com/200?text=HH",
        bannerColor: "from-green-600 to-green-400",
        rating: 4.7,
        reviewCount: 92,
        verified: true
      }
    ];

    const createdVendors: Vendor[] = [];
    for (const vendorData of vendors) {
      const vendor = await this.createVendor(vendorData);
      createdVendors.push(vendor);
    }

    // Create demo products
    const products: InsertProduct[] = [
      // Electronics (Category 2)
      {
        name: "Wireless Bluetooth Headphones",
        description: "Premium sound quality with noise cancellation and 30-hour battery life",
        price: 129.99,
        comparePrice: 159.99,
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
        inventory: 25,
        categoryId: 2,
        vendorId: createdVendors[0].id,
        isNew: true,
        isTrending: true,
        rating: 4.8,
        reviewCount: 124
      },
      {
        name: "Smart Watch Series 5",
        description: "Track your fitness, monitor your health, and stay connected with this advanced smartwatch",
        price: 249.99,
        comparePrice: 299.99,
        imageUrl: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500",
        inventory: 12,
        categoryId: 2,
        vendorId: createdVendors[0].id,
        isNew: true,
        isTrending: false,
        rating: 4.6,
        reviewCount: 89
      },
      {
        name: "4K Ultra HD Smart TV - 55 inch",
        description: "Crystal clear picture quality with smart features for streaming and gaming",
        price: 499.99,
        comparePrice: 599.99,
        imageUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500",
        inventory: 8,
        categoryId: 2,
        vendorId: createdVendors[0].id,
        isNew: false,
        isTrending: true,
        rating: 4.7,
        reviewCount: 56
      },
      
      // Fashion (Category 1)
      {
        name: "Premium Leather Jacket",
        description: "Genuine leather jacket with modern design for a timeless look",
        price: 199.99,
        comparePrice: 249.99,
        imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500",
        inventory: 15,
        categoryId: 1,
        vendorId: createdVendors[1].id,
        isNew: false,
        isTrending: true,
        rating: 4.9,
        reviewCount: 42
      },
      {
        name: "Casual Summer Dress",
        description: "Light, breathable fabric perfect for hot summer days",
        price: 59.99,
        comparePrice: 79.99,
        imageUrl: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=500",
        inventory: 30,
        categoryId: 1,
        vendorId: createdVendors[1].id,
        isNew: true,
        isTrending: true,
        rating: 4.5,
        reviewCount: 78
      },
      {
        name: "Designer Sunglasses",
        description: "UV protection with stylish frames for any occasion",
        price: 89.99,
        comparePrice: 109.99,
        imageUrl: "https://images.unsplash.com/photo-1577803645773-f96470509666?w=500",
        inventory: 18,
        categoryId: 1,
        vendorId: createdVendors[1].id,
        isNew: true,
        isTrending: false,
        rating: 4.6,
        reviewCount: 37
      },
      
      // Home (Category 3)
      {
        name: "Modern Coffee Table",
        description: "Sleek design with durable materials perfect for any living room",
        price: 149.99,
        comparePrice: 199.99,
        imageUrl: "https://images.unsplash.com/photo-1499933374294-4584851497cc?w=500",
        inventory: 7,
        categoryId: 3,
        vendorId: createdVendors[2].id,
        isNew: false,
        isTrending: false,
        rating: 4.7,
        reviewCount: 29
      },
      {
        name: "Memory Foam Mattress - Queen",
        description: "Cloud-like comfort for the best sleep of your life with cooling technology",
        price: 599.99,
        comparePrice: 799.99,
        imageUrl: "https://images.unsplash.com/photo-1631157852824-10b68759173a?w=500",
        inventory: 5,
        categoryId: 3,
        vendorId: createdVendors[2].id,
        isNew: true,
        isTrending: true,
        rating: 4.9,
        reviewCount: 115
      },
      {
        name: "Ceramic Dinner Set - 16 Piece",
        description: "Elegant and durable dishes for everyday use or special occasions",
        price: 89.99,
        comparePrice: 119.99,
        imageUrl: "https://images.unsplash.com/photo-1603199766980-91ebf5e9834d?w=500",
        inventory: 12,
        categoryId: 3,
        vendorId: createdVendors[2].id,
        isNew: false,
        isTrending: true,
        rating: 4.8,
        reviewCount: 42
      }
    ];

    for (const productData of products) {
      await this.createProduct(productData);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }
  
  // Vendor methods
  async getVendor(id: number): Promise<Vendor | undefined> {
    return this.vendors.get(id);
  }
  
  async getVendorByUserId(userId: number): Promise<Vendor | undefined> {
    return Array.from(this.vendors.values()).find(
      (vendor) => vendor.userId === userId,
    );
  }
  
  async getVendorByName(storeName: string): Promise<Vendor | undefined> {
    return Array.from(this.vendors.values()).find(
      (vendor) => vendor.storeName === storeName,
    );
  }
  
  async getAllVendors(): Promise<Vendor[]> {
    return Array.from(this.vendors.values());
  }
  
  async getFeaturedVendors(limit: number = 6): Promise<Vendor[]> {
    const vendors = Array.from(this.vendors.values());
    const featured = vendors.filter(v => v.productCount > 0 && v.verified);
    return featured.slice(0, limit);
  }
  
  async createVendor(insertVendor: InsertVendor): Promise<Vendor> {
    const id = this.currentVendorId++;
    const vendor: Vendor = { 
      ...insertVendor, 
      id, 
      rating: 0, 
      reviewCount: 0, 
      productCount: 0,
      verified: false
    };
    this.vendors.set(id, vendor);
    return vendor;
  }
  
  async updateVendorProductCount(vendorId: number, increment: boolean): Promise<void> {
    const vendor = await this.getVendor(vendorId);
    if (vendor) {
      vendor.productCount = increment 
        ? vendor.productCount + 1 
        : Math.max(0, vendor.productCount - 1);
      this.vendors.set(vendorId, vendor);
    }
  }
  
  // Category methods
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(
      (category) => category.slug === slug,
    );
  }
  
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = { ...insertCategory, id, productCount: 0 };
    this.categories.set(id, category);
    return category;
  }
  
  async updateCategoryProductCount(categoryId: number, increment: boolean): Promise<void> {
    const category = await this.getCategory(categoryId);
    if (category) {
      category.productCount = increment 
        ? category.productCount + 1 
        : Math.max(0, category.productCount - 1);
      this.categories.set(categoryId, category);
    }
  }
  
  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async getProductsByVendor(vendorId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.vendorId === vendorId,
    );
  }
  
  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.categoryId === categoryId,
    );
  }
  
  async getNewProducts(limit: number = 10): Promise<Product[]> {
    const allProducts = Array.from(this.products.values());
    const newProducts = allProducts.filter(p => p.isNew);
    return newProducts.slice(0, limit);
  }
  
  async getTrendingProducts(limit: number = 10): Promise<Product[]> {
    const allProducts = Array.from(this.products.values());
    const trendingProducts = allProducts.filter(p => p.isTrending);
    return trendingProducts.slice(0, limit);
  }
  
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const product: Product = { 
      ...insertProduct, 
      id, 
      rating: 0, 
      reviewCount: 0,
      createdAt: new Date()
    };
    this.products.set(id, product);
    
    // Update counts
    await this.updateVendorProductCount(product.vendorId, true);
    await this.updateCategoryProductCount(product.categoryId, true);
    
    return product;
  }
  
  // Cart methods
  async getCart(userId: number): Promise<{ cart: Cart, items: (CartItem & { product: Product })[] } | undefined> {
    const cart = Array.from(this.carts.values()).find(
      (cart) => cart.userId === userId,
    );
    
    if (!cart) return undefined;
    
    const items = Array.from(this.cartItems.values())
      .filter(item => item.cartId === cart.id)
      .map(item => {
        const product = this.products.get(item.productId);
        if (!product) throw new Error(`Product not found: ${item.productId}`);
        return { ...item, product };
      });
    
    return { cart, items };
  }
  
  async createCart(insertCart: InsertCart): Promise<Cart> {
    const id = this.currentCartId++;
    const cart: Cart = { ...insertCart, id, createdAt: new Date() };
    this.carts.set(id, cart);
    return cart;
  }
  
  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    // Check if the item already exists in the cart
    const existingItem = Array.from(this.cartItems.values()).find(
      item => item.cartId === insertCartItem.cartId && item.productId === insertCartItem.productId
    );
    
    if (existingItem) {
      // Update quantity instead of adding new item
      return this.updateCartItem(existingItem.id, existingItem.quantity + insertCartItem.quantity) as Promise<CartItem>;
    }
    
    const id = this.currentCartItemId++;
    const cartItem: CartItem = { ...insertCartItem, id };
    this.cartItems.set(id, cartItem);
    return cartItem;
  }
  
  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const cartItem = this.cartItems.get(id);
    if (!cartItem) return undefined;
    
    if (quantity <= 0) {
      await this.removeCartItem(id);
      return undefined;
    }
    
    const updatedItem: CartItem = { ...cartItem, quantity };
    this.cartItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async removeCartItem(id: number): Promise<void> {
    this.cartItems.delete(id);
  }
  
  async clearCart(cartId: number): Promise<void> {
    const itemsToRemove = Array.from(this.cartItems.values())
      .filter(item => item.cartId === cartId)
      .map(item => item.id);
    
    itemsToRemove.forEach(id => this.cartItems.delete(id));
  }
  
  // Order methods
  async createOrder(insertOrder: InsertOrder, items: Omit<InsertOrderItem, "orderId">[]): Promise<Order> {
    const id = this.currentOrderId++;
    const order: Order = { ...insertOrder, id, createdAt: new Date() };
    this.orders.set(id, order);
    
    // Create order items
    items.forEach(item => {
      const orderItemId = this.currentOrderItemId++;
      const orderItem: OrderItem = { ...item, id: orderItemId, orderId: id };
      this.orderItems.set(orderItemId, orderItem);
    });
    
    return order;
  }
  
  async getOrdersByUser(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getOrder(id: number): Promise<{ order: Order, items: (OrderItem & { product: Product })[] } | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const items = Array.from(this.orderItems.values())
      .filter(item => item.orderId === id)
      .map(item => {
        const product = this.products.get(item.productId);
        if (!product) throw new Error(`Product not found: ${item.productId}`);
        return { ...item, product };
      });
    
    return { order, items };
  }
}

// Import DatabaseStorage
import { DatabaseStorage } from "./db-storage";

// Use PostgreSQL database storage instead of memory storage
export const storage = new DatabaseStorage();
