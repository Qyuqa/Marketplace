CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  vendor_id INTEGER NOT NULL REFERENCES vendors(id),
  order_id INTEGER REFERENCES orders(id),
  rating INTEGER NOT NULL,
  title TEXT,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);