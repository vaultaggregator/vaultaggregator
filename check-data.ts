import { db } from "./server/db";
import { networks, protocols, tokens } from "./shared/schema";

async function checkData() {
  try {
    const networksData = await db.select().from(networks);
    const protocolsData = await db.select().from(protocols);
    const tokensData = await db.select().from(tokens);
    
    console.log("Networks:", networksData.length);
    console.log("Protocols:", protocolsData.length);
    console.log("Tokens:", tokensData.length);
    
    if (networksData.length > 0) {
      console.log("Sample network:", networksData[0].displayName);
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkData();
