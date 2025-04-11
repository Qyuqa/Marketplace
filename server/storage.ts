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
  
  // Session store
  sessionStore: session.SessionStore;
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
    
    // Initialize with categories
    this.initializeCategories();
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

export const storage = new MemStorage();
