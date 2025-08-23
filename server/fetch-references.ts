import fs from 'fs';
import path from 'path';

// Simple script to fetch and save reference HTML for layout study
// This strips all scripts, styles, and external assets to avoid copying any code

async function fetchAndSaveReference(url: string, filename: string) {
  try {
    console.log(`Fetching ${url}...`);
    const response = await fetch(url);
    const html = await response.text();
    
    // Strip scripts, styles, and clean the HTML
    const cleanedHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<link[^>]*>/gi, '')
      .replace(/style="[^"]*"/gi, '')
      .replace(/class="[^"]*"/gi, 'class="[REMOVED]"')
      .replace(/src="[^"]*"/gi, 'src="[REMOVED]"')
      .replace(/href="[^"]*"/gi, 'href="[REMOVED]"');
    
    const outputPath = path.join(process.cwd(), 'references', 'html', filename);
    fs.writeFileSync(outputPath, cleanedHtml);
    console.log(`Saved ${filename}`);
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
  }
}

async function main() {
  const references = [
    { url: 'https://app.vaults.fyi/discover', filename: 'vaults-discover.html' },
    { url: 'https://app.vaults.fyi/dashboard', filename: 'vaults-dashboard.html' },
  ];
  
  for (const ref of references) {
    await fetchAndSaveReference(ref.url, ref.filename);
  }
  
  console.log('Reference fetching complete');
}

main();