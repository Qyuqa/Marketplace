// Fix vendor users
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function fixVendorFlag() {
  try {
    // Get all users
    const allUsers = await db.select().from(users);
    console.log("All users:", allUsers);
    
    // Find user with ID 3 (rentgari)
    const user = allUsers.find(u => u.id === 3);
    
    if (user) {
      console.log("Found user:", user);
      
      // Update the isVendor flag if needed
      if (!user.isVendor) {
        console.log("Setting isVendor flag to true for user:", user.username);
        
        // Update the user in the database
        await db.update(users)
          .set({ isVendor: true })
          .where(eq(users.id, 3));
          
        console.log("User updated successfully!");
      } else {
        console.log("User is already marked as a vendor:", user.isVendor);
      }
    } else {
      console.log("User with ID 3 not found");
    }
  } catch (error) {
    console.error("Error fixing vendor flag:", error);
  }
}

fixVendorFlag().then(() => process.exit(0));