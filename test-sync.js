import { syncData } from './server/services/defi-llama.js';

console.log('Triggering manual sync...');
syncData().then(() => {
  console.log('Manual sync completed');
}).catch((error) => {
  console.error('Manual sync failed:', error);
});