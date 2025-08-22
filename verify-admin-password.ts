
import bcrypt from "bcrypt";
import { db } from "./server/db";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";

async function verifyAdminPassword() {
  try {
    console.log("🔍 Verifying admin password...");
    
    const user = await db.select().from(users).where(eq(users.username, "admin")).limit(1);
    
    if (user.length === 0) {
      console.log("❌ No admin user found");
      return;
    }
    
    const adminUser = user[0];
    console.log(`✅ Found admin user: ${adminUser.username} (ID: ${adminUser.id})`);
    
    // Test password verification
    const testPassword = "admin123";
    const isValidPassword = await bcrypt.compare(testPassword, adminUser.password);
    
    console.log(`🔐 Password verification result: ${isValidPassword ? '✅ VALID' : '❌ INVALID'}`);
    
    if (!isValidPassword) {
      console.log("🔧 Updating password to ensure it works...");
      const newHashedPassword = await bcrypt.hash(testPassword, 10);
      
      await db.update(users)
        .set({ password: newHashedPassword })
        .where(eq(users.id, adminUser.id));
      
      console.log("✅ Password updated successfully!");
      console.log(`Username: admin`);
      console.log(`Password: admin123`);
    } else {
      console.log("✅ Password is correct and should work for login");
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    process.exit(0);
  }
}

verifyAdminPassword();
