
import bcrypt from "bcrypt";
import { db } from "./server/db";
import { users } from "./shared/schema";

async function createAdminUser() {
  try {
    console.log("🔧 Setting up admin user...");
    
    const username = "admin";
    const password = "admin123"; // Change this to a secure password
    
    // Check if user already exists
    const existingUsers = await db.select().from(users);
    console.log(`Found ${existingUsers.length} existing users`);
    
    if (existingUsers.length > 0) {
      console.log("✅ Admin user already exists. Existing users:");
      existingUsers.forEach(user => {
        console.log(`- Username: ${user.username}, ID: ${user.id}`);
      });
      return;
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create the admin user
    const newUser = await db.insert(users).values({
      username,
      password: hashedPassword,
    }).returning();
    
    console.log("✅ Admin user created successfully!");
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log("⚠️  Please change the password after first login!");
    console.log(`User ID: ${newUser[0].id}`);
    
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  } finally {
    process.exit(0);
  }
}

createAdminUser();
