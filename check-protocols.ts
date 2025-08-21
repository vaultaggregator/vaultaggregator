import { db } from './server/db';
import { protocols } from './shared/schema';

async function checkProtocols() {
  const prots = await db.select().from(protocols);
  console.log('Protocols in database:');
  prots.forEach(p => {
    console.log(`- Name: ${p.name}, Slug: ${p.slug || 'NULL'}, ID: ${p.id}`);
  });
  process.exit(0);
}

checkProtocols();
