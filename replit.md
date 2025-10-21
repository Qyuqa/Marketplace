# Qyuqa - Multivendor Marketplace

## Overview

Qyuqa is a modern e-commerce platform that enables multiple vendors to sell products to customers in a unified marketplace. The application provides a complete shopping experience with vendor management, product catalogs, shopping carts, order processing, and customer reviews. It's built as a Progressive Web App (PWA) with offline capabilities and mobile-first design.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript for type-safe component development
- Vite as the build tool for fast development and optimized production builds
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching
- Radix UI components with shadcn/ui for accessible, customizable UI components
- Tailwind CSS for utility-first styling with custom theming support

**Design Patterns:**
- Context-based state management for authentication (`AuthContext`) and shopping cart (`CartContext`)
- Custom hooks pattern for encapsulating business logic (`use-auth`, `use-cart`, `use-reviews`)
- Component composition with separated concerns (layout, pages, feature components)
- Protected routes for authenticated-only pages using a custom `ProtectedRoute` component

**Key Architectural Decisions:**
- PWA implementation with service workers for offline functionality and app-like experience
- Session-based authentication with explicit logout timestamp tracking in localStorage to prevent stale sessions
- Optimistic UI updates with React Query mutations for responsive user experience
- Currency display system showing both KSh (primary) and USD (secondary) for localized pricing

### Backend Architecture

**Technology Stack:**
- Express.js server with TypeScript
- Drizzle ORM for type-safe database operations
- Neon serverless PostgreSQL database
- Passport.js with local strategy for session-based authentication
- Multer for file upload handling

**Design Patterns:**
- Repository pattern with storage abstraction layer (`IStorage` interface)
- Middleware-based request processing (authentication, logging, error handling)
- RESTful API design with resource-based endpoints
- Session management with PostgreSQL-backed session store

**Key Architectural Decisions:**
- Chosen session-based authentication over JWT for better security and session invalidation control
- Database abstraction through storage interface allows future migration to different storage backends
- Centralized error handling and request logging middleware
- File uploads stored with UUID-based filenames to prevent conflicts

### Data Layer

**Database Schema:**
- **Users table**: Stores customer, vendor, and admin accounts with role-based flags
- **Vendors table**: Extended vendor profiles linked to user accounts with application status tracking
- **Categories table**: Product categorization with icon customization and product counts
- **Products table**: Product catalog with vendor relationships, pricing, inventory, and feature flags
- **Carts & CartItems**: User shopping cart persistence with product references and pricing snapshots
- **Orders & OrderItems**: Order history with status tracking and fulfillment details
- **Reviews**: Product and vendor reviews with ratings

**Design Decisions:**
- Denormalized product counts in categories and vendors for performance
- Price snapshots in cart/order items to maintain historical pricing accuracy
- Separate vendor application status field to manage onboarding workflow
- Boolean flags (isNew, trending, featured) for flexible product merchandising

### Authentication & Authorization

**Authentication Flow:**
- Session-based authentication using Passport.js Local Strategy
- Password hashing with scrypt and salting for security
- Express sessions stored in PostgreSQL for persistence across server restarts
- Dual-timestamp approach (login/logout) in localStorage to handle client-side session state

**Authorization Levels:**
- Customer: Basic shopping and order placement
- Vendor: Product management dashboard access, requires approved vendor profile
- Admin: Vendor application approval, system-wide management

**Security Measures:**
- CSRF protection through session-based authentication
- Password complexity requirements enforced at schema level
- Secure session cookies with HTTP-only flags (when in production)
- Timing-safe password comparison to prevent timing attacks

### External Dependencies

**Third-Party Services:**
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket support for connection pooling
- **Unsplash**: Image hosting for placeholder and demo product images
- **Google Fonts**: Varela Round font family for consistent typography

**Payment Integration:**
- Stripe integration scaffolded with @stripe/stripe-js and @stripe/react-stripe-js packages
- Payment processing endpoints prepared but implementation incomplete

**Development Tools:**
- Replit-specific plugins for development banner and theme JSON handling
- Cartographer plugin for development environment code mapping
- Runtime error overlay for better development experience

**PWA Infrastructure:**
- Service worker registration for offline capability
- Web app manifest for installability
- Cache-first strategy for static assets
- Multiple icon sizes for different device requirements