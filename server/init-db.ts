import { storage } from './storage';

async function initializeDatabase() {
  console.log('Starting database initialization...');
  try {
    await storage.initializeData();
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();