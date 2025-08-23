/**
 * Hardcode Scanner Service
 * Scans codebase for hardcoded values and generates reports
 */

import fs from 'fs';
import path from 'path';
// Import specific constants to avoid config import issues
const CACHE_TTL = 300; // 5 minutes
const CACHE_HARD_TTL = 30; // 30 seconds

export interface HardcodeFinding {
  file: string;
  line: number;
  column: number;
  type: 'address' | 'url' | 'chainId' | 'timeConstant' | 'apiKey' | 'tokenSymbol';
  value: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestion?: string;
}

export interface HardcodeReport {
  timestamp: string;
  totalFindings: number;
  severityCounts: Record<string, number>;
  findings: HardcodeFinding[];
  summary: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
}

// Patterns to detect hardcoded values
const PATTERNS = {
  // Ethereum addresses (0x followed by 40 hex chars)
  address: /\b0x[a-fA-F0-9]{40}\b/g,
  
  // HTTP/HTTPS URLs
  httpUrl: /https?:\/\/[^\s'"`;,)}\]]+/g,
  
  // WebSocket URLs
  wsUrl: /wss?:\/\/[^\s'"`;,)}\]]+/g,
  
  // Chain IDs (common ones as numbers or strings)
  chainId: /\b(?:1|8453|42161|137|10|56|250|43114|1285|1284|1287)\b/g,
  
  // Time constants (common values in seconds)
  timeConstant: /\b(?:31536000|2592000|604800|86400|3600|1800|900|600|300|60|30)\b/g,
  
  // Token symbols in conditionals/maps
  tokenSymbol: /['"](?:USDC|USDT|WETH|DAI|STETH|ETH|BTC|MATIC|AVAX|BNB)['"]:/g,
  
  // API keys patterns (common prefixes)
  apiKey: /(?:sk-|pk_|key_|token_|api_)[a-zA-Z0-9]{20,}/g,
};

// Files to ignore during scanning
const IGNORE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /dist/,
  /build/,
  /coverage/,
  /\.env/,
  /\.env\./,
  /package-lock\.json/,
  /yarn\.lock/,
  /\.log$/,
  /\.md$/,
  /\.json$/, // Ignore JSON configs for now
  /test/,
  /tests/,
  /spec/,
  /__tests__/,
  /config\//,  // Ignore our config directory
  /attached_assets/,
  /logs/,
];

// Severity rules based on pattern type and context
function getSeverity(type: string, value: string, filePath: string): 'low' | 'medium' | 'high' | 'critical' {
  // Critical: addresses and API keys in source code
  if (type === 'address' && !filePath.includes('test') && !filePath.includes('config')) {
    return 'critical';
  }
  
  if (type === 'apiKey') {
    return 'critical';
  }
  
  // High: URLs and chain IDs in source code
  if ((type === 'url' || type === 'chainId') && !filePath.includes('test')) {
    return 'high';
  }
  
  // Medium: time constants and token symbols
  if (type === 'timeConstant' || type === 'tokenSymbol') {
    return 'medium';
  }
  
  return 'low';
}

// Generate suggestions for fixes
function getSuggestion(type: string, value: string): string {
  switch (type) {
    case 'address':
      return `Move to cfg.tokens registry or pool database lookup`;
    case 'url':
      return `Move to cfg.endpoints configuration`;
    case 'chainId':
      return `Replace with cfg.chains[chainName].id`;
    case 'timeConstant':
      return `Replace with cfg.constants.* value`;
    case 'tokenSymbol':
      return `Use cfg.tokens map or database lookup`;
    case 'apiKey':
      return `Move to environment variable`;
    default:
      return `Move to configuration layer`;
  }
}

// Scan a single file for hardcoded values
function scanFile(filePath: string): HardcodeFinding[] {
  const findings: HardcodeFinding[] = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Check each pattern
    Object.entries(PATTERNS).forEach(([patternName, pattern]) => {
      let match;
      const globalPattern = new RegExp(pattern.source, 'g');
      
      while ((match = globalPattern.exec(content)) !== null) {
        const value = match[0];
        
        // Find line and column
        const beforeMatch = content.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;
        const column = beforeMatch.split('\n').pop()?.length || 0;
        
        // Skip if it's in a comment (basic check)
        const line = lines[lineNumber - 1];
        if (line && (line.trim().startsWith('//') || line.trim().startsWith('*'))) {
          continue;
        }
        
        const type = patternName === 'httpUrl' || patternName === 'wsUrl' ? 'url' : patternName as any;
        const severity = getSeverity(type, value, filePath);
        
        findings.push({
          file: filePath,
          line: lineNumber,
          column: column + 1,
          type,
          value,
          severity,
          suggestion: getSuggestion(type, value)
        });
      }
    });
  } catch (error) {
    console.error(`Error scanning file ${filePath}:`, error);
  }
  
  return findings;
}

// Recursively scan directory
function scanDirectory(dirPath: string, basePath: string = ''): HardcodeFinding[] {
  const findings: HardcodeFinding[] = [];
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.join(basePath, entry.name);
      
      // Skip ignored patterns
      if (IGNORE_PATTERNS.some(pattern => pattern.test(relativePath))) {
        continue;
      }
      
      if (entry.isDirectory()) {
        findings.push(...scanDirectory(fullPath, relativePath));
      } else if (entry.isFile()) {
        // Only scan relevant file types
        const ext = path.extname(entry.name);
        if (['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte'].includes(ext)) {
          findings.push(...scanFile(fullPath));
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
  }
  
  return findings;
}

// Main scan function
export async function run(): Promise<HardcodeReport> {
  console.log('🔍 Starting hardcode scan...');
  
  const startTime = Date.now();
  const findings: HardcodeFinding[] = [];
  
  // Scan target directories
  const targetDirs = ['src', 'client/src', 'server', 'shared', 'admin'];
  const rootDir = process.cwd();
  
  for (const dir of targetDirs) {
    const dirPath = path.join(rootDir, dir);
    if (fs.existsSync(dirPath)) {
      console.log(`📁 Scanning ${dir}/...`);
      findings.push(...scanDirectory(dirPath, dir));
    }
  }
  
  // Calculate severity counts
  const severityCounts = findings.reduce((acc, finding) => {
    acc[finding.severity] = (acc[finding.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const report: HardcodeReport = {
    timestamp: new Date().toISOString(),
    totalFindings: findings.length,
    severityCounts,
    findings: findings.sort((a, b) => {
      // Sort by severity (critical first), then by file
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      return severityDiff !== 0 ? severityDiff : a.file.localeCompare(b.file);
    }),
    summary: {
      criticalCount: severityCounts.critical || 0,
      highCount: severityCounts.high || 0,
      mediumCount: severityCounts.medium || 0,
      lowCount: severityCounts.low || 0,
    }
  };
  
  // Write reports to admin/tools/
  const toolsDir = path.join(rootDir, 'admin', 'tools');
  if (!fs.existsSync(toolsDir)) {
    fs.mkdirSync(toolsDir, { recursive: true });
  }
  
  // JSON report
  const jsonPath = path.join(toolsDir, 'hardcode-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  
  // Human-readable report
  const txtPath = path.join(toolsDir, 'hardcode-report.txt');
  const humanReport = generateHumanReport(report);
  fs.writeFileSync(txtPath, humanReport);
  
  const duration = Date.now() - startTime;
  console.log(`✅ Hardcode scan completed in ${duration}ms`);
  console.log(`📊 Found ${report.totalFindings} issues: ${report.summary.criticalCount} critical, ${report.summary.highCount} high, ${report.summary.mediumCount} medium, ${report.summary.lowCount} low`);
  
  return report;
}

function generateHumanReport(report: HardcodeReport): string {
  const lines = [
    'HARDCODE SCAN REPORT',
    '===================',
    '',
    `Generated: ${report.timestamp}`,
    `Total Findings: ${report.totalFindings}`,
    '',
    'SEVERITY BREAKDOWN:',
    `  Critical: ${report.summary.criticalCount}`,
    `  High:     ${report.summary.highCount}`,
    `  Medium:   ${report.summary.mediumCount}`,
    `  Low:      ${report.summary.lowCount}`,
    '',
    'FINDINGS:',
    '========',
    ''
  ];
  
  const groupedFindings = report.findings.reduce((acc, finding) => {
    if (!acc[finding.file]) acc[finding.file] = [];
    acc[finding.file].push(finding);
    return acc;
  }, {} as Record<string, HardcodeFinding[]>);
  
  Object.entries(groupedFindings).forEach(([file, findings]) => {
    lines.push(`📁 ${file}`);
    findings.forEach(finding => {
      lines.push(`   ${finding.line}:${finding.column} [${finding.severity.toUpperCase()}] ${finding.type}: ${finding.value}`);
      if (finding.suggestion) {
        lines.push(`      💡 ${finding.suggestion}`);
      }
    });
    lines.push('');
  });
  
  return lines.join('\n');
}

// Export for CLI usage - removed require.main check for ES modules