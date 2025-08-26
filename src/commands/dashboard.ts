import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import { spawn } from 'child_process';
import { promisify } from 'util';

interface UsageDay {
  date: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  totalCost: number;
  modelsUsed: string[];
  modelBreakdowns: Array<{
    modelName: string;
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    cost: number;
  }>;
}

interface UsageData {
  daily: UsageDay[];
  totals: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    totalCost: number;
    totalTokens: number;
  };
}

interface ProcessedUsageData {
  daily: UsageDay[];
  totals: UsageData['totals'];
  metadata: {
    generatedAt: string;
    totalDays: number;
    dateRange: {
      start: string;
      end: string;
    };
    averageDaily: {
      cost: number;
      tokens: number;
      inputTokens: number;
      outputTokens: number;
    };
    peakUsage: {
      date: string;
      cost: number;
      tokens: number;
    };
    models: string[];
  };
}

interface ProcessedProject {
  path: string;
  totalSize: number;
  historyItems: Array<{
    display: string;
    size: number;
  }>;
}

interface ProjectData {
  history?: Array<{ display: string }>;
  [key: string]: any;
}

interface ClaudeData {
  projects: Record<string, ProjectData>;
}

interface UnifiedDashboardData {
  version?: string;
  projects?: {
    projects: ProcessedProject[];
    executions: any[];
    metadata: {
      generatedAt: string;
      totalProjects: number;
      totalSize: number;
      totalEntries: number;
      totalExecutions: number;
    };
  };
  usage?: ProcessedUsageData;
  executions?: any[];
  executionStats?: {
    dailyStats?: any[];
    totalCount?: number;
  };
}

interface DataFreshness {
  exists: boolean;
  path: string;
  age?: number; // in minutes
  needsRefresh: boolean;
}

function checkDataFreshness(): DataFreshness {
  const currentDir = process.cwd();
  const usageFilePath = path.join(currentDir, '.data', 'usage.json');
  
  if (!fs.existsSync(usageFilePath)) {
    return {
      exists: false,
      path: usageFilePath,
      needsRefresh: true
    };
  }
  
  const stats = fs.statSync(usageFilePath);
  const ageInMinutes = (Date.now() - stats.mtime.getTime()) / (1000 * 60);
  const needsRefresh = ageInMinutes > 60; // Refresh if older than 1 hour
  
  return {
    exists: true,
    path: usageFilePath,
    age: ageInMinutes,
    needsRefresh
  };
}

async function refreshUsageData(outputPath: string): Promise<boolean> {
  console.log(chalk.blue('🔄 Fetching latest usage data (this may take a moment)...'));
  
  return new Promise((resolve) => {
    // Ensure the .data directory exists
    const dataDir = path.dirname(outputPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Try to use ccusage directly first (faster), fallback to npx
    const commands = [
      { cmd: 'ccusage', args: ['--json'] },
      { cmd: 'npx', args: ['ccusage', '--json'] }
    ];
    
    let attemptIndex = 0;
    const tryCommand = () => {
      if (attemptIndex >= commands.length) {
        console.log(chalk.red('❌ Failed to execute ccusage with any method'));
        resolve(false);
        return;
      }
      
      const { cmd, args } = commands[attemptIndex];
      console.log(chalk.gray(`  Trying: ${cmd} ${args.join(' ')}`));
      
      const child = spawn(cmd, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32'
      });
      
      let jsonOutput = '';
      let errorOutput = '';
      
      // Set a shorter initial timeout, with warning
      let warningShown = false;
      const warningTimeout = setTimeout(() => {
        if (!warningShown) {
          console.log(chalk.yellow('  ⏱️  Still fetching usage data... (API may be slow)'));
          warningShown = true;
        }
      }, 5000); // Show warning after 5 seconds
      
      const timeout = setTimeout(() => {
        console.log(chalk.yellow('  ⏱️  Timeout reached, cancelling...'));
        child.kill();
        attemptIndex++;
        tryCommand(); // Try next command
      }, 15000); // Reduced to 15 second timeout
    
      child.stdout?.on('data', (data) => {
        jsonOutput += data.toString();
      });
      
      child.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      child.on('close', (code) => {
        clearTimeout(timeout);
        clearTimeout(warningTimeout);
        
        if (code === 0 && jsonOutput.trim()) {
          try {
            // Validate JSON format
            const parsedData = JSON.parse(jsonOutput);
            
            // Write to file
            fs.writeFileSync(outputPath, jsonOutput, 'utf8');
            console.log(chalk.green('✅ Usage data refreshed successfully'));
            resolve(true);
          } catch (error) {
            console.log(chalk.red(`❌ Failed to parse usage data JSON from ${cmd}`));
            console.log(chalk.gray(`Error: ${error}`));
            attemptIndex++;
            tryCommand(); // Try next command
          }
        } else {
          if (code === null) {
            // Killed by timeout, already trying next command
            return;
          }
          console.log(chalk.gray(`  ${cmd} failed with code ${code}`));
          if (errorOutput && errorOutput.includes('command not found')) {
            console.log(chalk.gray(`  ${cmd} not found`));
          }
          attemptIndex++;
          tryCommand(); // Try next command
        }
      });
      
      child.on('error', (error) => {
        clearTimeout(timeout);
        clearTimeout(warningTimeout);
        console.log(chalk.gray(`  ${cmd} error: ${error.message}`));
        attemptIndex++;
        tryCommand(); // Try next command
      });
    };
    
    tryCommand(); // Start with first command
  });
}

async function getUsageData(forceRefresh: boolean = false): Promise<{ data: UsageData; path: string } | null> {
  const freshness = checkDataFreshness();
  
  // Check if we need to refresh data
  if (forceRefresh || freshness.needsRefresh) {
    if (freshness.exists && freshness.age !== undefined) {
      const ageDisplay = freshness.age < 60 
        ? `${Math.round(freshness.age)} minutes` 
        : `${Math.round(freshness.age / 60)} hours`;
      console.log(chalk.yellow(`📅 Usage data is ${ageDisplay} old, refreshing...`));
    } else {
      console.log(chalk.yellow('📊 No usage data found, fetching...'));
    }
    
    const refreshSuccess = await refreshUsageData(freshness.path);
    
    if (!refreshSuccess && !freshness.exists) {
      // Failed to refresh and no cached data available
      return null;
    } else if (!refreshSuccess && freshness.exists) {
      // Failed to refresh but have cached data
      console.log(chalk.yellow('⚠️  Using cached usage data due to refresh failure'));
    }
  } else if (freshness.exists) {
    const ageDisplay = freshness.age! < 60 
      ? `${Math.round(freshness.age!)} minutes` 
      : `${Math.round(freshness.age! / 60)} hours`;
    console.log(chalk.green(`📊 Using cached usage data (${ageDisplay} old)`));
  }
  
  // Read the data file
  try {
    const rawData = fs.readFileSync(freshness.path, 'utf8');
    const usageData: UsageData = JSON.parse(rawData);
    return { data: usageData, path: freshness.path };
  } catch (error) {
    console.error(chalk.red('Error reading usage data file:'), error);
    return null;
  }
}

function processUsageData(rawData: UsageData): ProcessedUsageData {
  const sortedDaily = [...rawData.daily].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Calculate metadata
  const totalDays = sortedDaily.length;
  const dateRange = {
    start: sortedDaily[0]?.date || '',
    end: sortedDaily[sortedDaily.length - 1]?.date || ''
  };
  
  const averageDaily = {
    cost: totalDays > 0 ? rawData.totals.totalCost / totalDays : 0,
    tokens: totalDays > 0 ? rawData.totals.totalTokens / totalDays : 0,
    inputTokens: totalDays > 0 ? rawData.totals.inputTokens / totalDays : 0,
    outputTokens: totalDays > 0 ? rawData.totals.outputTokens / totalDays : 0
  };
  
  // Find peak usage day
  const peakDay = sortedDaily.reduce((peak, day) => 
    day.totalCost > peak.totalCost ? day : peak, 
    sortedDaily[0] || { date: '', totalCost: 0, totalTokens: 0 }
  );
  
  const peakUsage = {
    date: peakDay.date,
    cost: peakDay.totalCost,
    tokens: peakDay.totalTokens
  };
  
  // Extract unique models
  const models = [...new Set(sortedDaily.flatMap(day => day.modelsUsed))];
  
  return {
    daily: sortedDaily,
    totals: rawData.totals,
    metadata: {
      generatedAt: new Date().toISOString(),
      totalDays,
      dateRange,
      averageDaily,
      peakUsage,
      models
    }
  };
}

function loadProjectsData(): { projects: ProcessedProject[], executions: any[], executionStats?: any } | null {
  try {
    // Load Claude data file
    const homeDir = os.homedir();
    const dataFilePath = path.join(homeDir, '.claude.json');
    
    if (!fs.existsSync(dataFilePath)) {
      console.warn(chalk.yellow('No Claude data file found'));
      return null;
    }
    
    const rawData = fs.readFileSync(dataFilePath, 'utf8');
    const data: ClaudeData = JSON.parse(rawData);
    
    if (!data.projects) {
      return { projects: [], executions: [] };
    }
    
    // Process projects
    const projects: ProcessedProject[] = Object.entries(data.projects)
      .map(([projectPath, projectData]) => {
        const historyItems = (projectData.history || []).map(item => ({
          display: item.display,
          size: JSON.stringify(item).length
        }));
        
        return {
          path: projectPath,
          totalSize: JSON.stringify(projectData).length,
          historyItems
        };
      });
    
    // Load execution data from SQLite database
    let executionData: any = { executions: [], dailyStats: [], totalCount: 0 };
    try {
      const Database = require('better-sqlite3');
      const claudeDbPath = path.join(homeDir, '.claude', 'db.sql');
      
      if (fs.existsSync(claudeDbPath)) {
        const db = new Database(claudeDbPath, { readonly: true });
        
        try {
          // First, get aggregated stats from all executions
          const statsStmt = db.prepare(`
            SELECT 
              date(timestamp) as day,
              COUNT(*) as count
            FROM executions 
            WHERE timestamp >= datetime('now', '-365 days')
            GROUP BY day
          `);
          
          const dailyStats = statsStmt.all();
          
          // Get total count
          const countStmt = db.prepare(`
            SELECT COUNT(*) as total
            FROM executions
            WHERE timestamp >= datetime('now', '-365 days')
          `);
          const totalCount = countStmt.get().total;
          
          // Get a reasonable sample of executions for the heatmap and tool usage
          // Include essential fields for both visualizations
          const stmt = db.prepare(`
            SELECT 
              timestamp,
              project_path,
              tool_name
            FROM executions 
            WHERE project_path IS NOT NULL
              AND timestamp >= datetime('now', '-30 days')
            ORDER BY timestamp DESC
            LIMIT 10000
          `);
          let executions = stmt.all();
          console.log(chalk.gray(`  Loaded ${executions.length} executions for heatmap`));
          
          // No fallback needed - if there's no data in last 30 days, show empty
          
          executionData = {
            executions: executions,
            dailyStats: dailyStats,
            totalCount: totalCount
          };
        } catch (err) {
          console.warn(chalk.yellow('Warning: Could not load execution data from database'));
        } finally {
          db.close();
        }
      }
    } catch (error) {
      console.warn(chalk.yellow('Warning: Could not access Claude execution database'));
    }
    
    return { projects, executions: executionData.executions || [], executionStats: { dailyStats: executionData.dailyStats, totalCount: executionData.totalCount } };
  } catch (error) {
    console.error(chalk.red('Error loading projects data:'), error);
    return null;
  }
}

async function generateDashboard(data: UnifiedDashboardData): Promise<void> {
  // Read the bento HTML template
  const templatePath = path.join(__dirname, '../templates/bento-dashboard.html');
  let template: string;
  
  try {
    template = fs.readFileSync(templatePath, 'utf8');
  } catch (error) {
    console.error(chalk.red('Error: Could not find bento dashboard template'));
    console.error(chalk.yellow('Make sure the template exists at: src/templates/bento-dashboard.html'));
    process.exit(1);
  }

  // Replace the data placeholder with base64-encoded JSON for safe embedding
  const jsonData = JSON.stringify(data);
  const base64Data = Buffer.from(jsonData).toString('base64');
  
  // Inject the base64 data that will be decoded in the browser
  const htmlContent = template.replace(
    '/*DATA_PLACEHOLDER*/', 
    `JSON.parse(atob('${base64Data}'))`
  );

  // Generate output file path
  const outputDir = os.tmpdir();
  const outputFile = path.join(outputDir, `claude-unified-dashboard-${Date.now()}.html`);

  try {
    // Write the HTML file
    fs.writeFileSync(outputFile, htmlContent);
    
    console.log(chalk.green('🎉 Claude Unified Dashboard generated!'));
    console.log(chalk.blue(`📄 Report saved to: ${outputFile}`));
    console.log(chalk.yellow('🌐 Opening in browser...'));

    // Open the file in browser using system commands
    try {
      console.log(chalk.blue('🔄 Attempting to open browser...'));
      
      const { spawn } = await import('child_process');
      
      const commands = [
        ['open', outputFile], // macOS
        ['xdg-open', outputFile], // Linux  
        ['start', '', outputFile], // Windows (empty string for start command)
      ];

      let opened = false;
      for (const [cmd, ...args] of commands) {
        try {
          console.log(chalk.gray(`   Trying: ${cmd} ${args.join(' ')}`));
          
          const child = spawn(cmd, args.filter(arg => arg !== ''), { 
            stdio: 'ignore', 
            detached: true,
            shell: process.platform === 'win32' // Use shell on Windows
          });
          
          // Give the command a moment to start
          await new Promise(resolve => setTimeout(resolve, 100));
          
          if (child.unref) {
            child.unref();
          }
          
          console.log(chalk.green(`✅ Browser opened with ${cmd}`));
          opened = true;
          break;
        } catch (err: any) {
          console.log(chalk.gray(`   ${cmd} failed: ${err?.message || err}`));
          continue;
        }
      }

      if (!opened) {
        // Try exec as last resort
        console.log(chalk.blue('🔄 Trying exec commands...'));
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        const execCommands = [
          `open "${outputFile}"`, // macOS
          `xdg-open "${outputFile}"`, // Linux
          `start "" "${outputFile}"`, // Windows
        ];

        for (const cmd of execCommands) {
          try {
            console.log(chalk.gray(`   Trying exec: ${cmd}`));
            await execAsync(cmd);
            console.log(chalk.green(`✅ Browser opened with exec: ${cmd}`));
            opened = true;
            break;
          } catch (err: any) {
            console.log(chalk.gray(`   exec failed: ${err?.message || err}`));
            continue;
          }
        }
      }

      if (!opened) {
        throw new Error('All browser opening strategies failed');
      }

    } catch (error: any) {
      console.log(chalk.red(`❌ Failed to open browser: ${error?.message || error}`));
      console.log(chalk.yellow(`💡 Please manually open this file in your browser:`));
      console.log(chalk.cyan(`   ${outputFile}`));
    }

    console.log(chalk.cyan('🔍 Dashboard is ready! Press Ctrl+C to exit'));
    
    // Setup cleanup function
    const cleanup = () => {
      console.log(chalk.yellow('\n🧹 Cleaning up...'));
      
      // Remove the temporary file
      try {
        fs.unlinkSync(outputFile);
        console.log(chalk.green('✅ Temporary file cleaned up'));
      } catch (error) {
        // File might already be deleted, ignore error
      }
      
      console.log(chalk.green('👋 Dashboard closed'));
      process.exit(0);
    };

    // Handle Ctrl+C gracefully
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // Keep the process running
    await new Promise(() => {}); // This will run indefinitely until interrupted

  } catch (error) {
    console.error(chalk.red(`Error writing dashboard file: ${error}`));
    process.exit(1);
  }
}

export async function dashboardCommand(options: { export?: string; format?: string; refresh?: boolean; view?: string; skipUsage?: boolean }) {
  try {
    // Create unified dashboard data
    const unifiedData: UnifiedDashboardData = {};
    
    // Load package.json version
    try {
      const packageJsonPath = path.join(__dirname, '../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      unifiedData.version = packageJson.version;
    } catch (error) {
      console.warn(chalk.yellow('Warning: Could not read package.json version'));
    }
    
    // Load data in parallel for better performance
    console.log(chalk.cyan('📊 Loading dashboard data...'));
    
    // Start operations in parallel (skip usage if requested)
    const loadPromises: Promise<any>[] = [
      // Load projects data (synchronous, wrapped in Promise)
      Promise.resolve(loadProjectsData())
    ];
    
    // Only load usage data if not skipped
    if (!options.skipUsage) {
      loadPromises.push(getUsageData(options.refresh));
    } else {
      console.log(chalk.gray('  Skipping usage data (--skip-usage)'));
      loadPromises.push(Promise.resolve(null));
    }
    
    const [projectsResult, usageResult] = await Promise.all(loadPromises);
    
    // Process projects data
    if (projectsResult) {
      const { projects, executions } = projectsResult;
      
      unifiedData.projects = {
        projects,
        executions,
        metadata: {
          generatedAt: new Date().toISOString(),
          totalProjects: projects.length,
          totalSize: projects.reduce((sum: number, p: ProcessedProject) => sum + p.totalSize, 0),
          totalEntries: projects.reduce((sum: number, p: ProcessedProject) => sum + p.historyItems.length, 0),
          totalExecutions: (projectsResult as any).executionStats?.totalCount || executions.length
        }
      };
      unifiedData.executions = executions;
      unifiedData.executionStats = (projectsResult as any).executionStats;
    }
    
    // Process usage data
    if (usageResult) {
      const { data: usageData } = usageResult;
      
      if (usageData.daily && usageData.daily.length > 0) {
        // Process the usage data
        const processedUsageData = processUsageData(usageData);
        unifiedData.usage = processedUsageData;
      }
    }
    
    // Check if we have any data
    if (!unifiedData.projects && !unifiedData.usage) {
      console.error(chalk.red('Error: No data available for dashboard'));
      console.error(chalk.yellow('Make sure you have:'));
      console.error(chalk.yellow('• Claude project data (~/.claude.json)'));
      console.error(chalk.yellow('• Usage data (run ccm usage first)'));
      process.exit(1);
    }
    
    // Handle export option
    if (options.export) {
      const exportFormat = options.format || 'json';
      
      if (!['json', 'csv'].includes(exportFormat)) {
        console.error(chalk.red(`❌ Invalid export format: ${exportFormat}. Supported formats: json, csv`));
        process.exit(1);
      }
      
      try {
        const exportContent = exportFormat === 'json' 
          ? JSON.stringify(unifiedData, null, 2)
          : generateCSVExport(unifiedData.usage!);
        
        fs.writeFileSync(options.export, exportContent, 'utf8');
        console.log(chalk.green(`✅ Data exported to: ${options.export}`));
        console.log(chalk.blue(`📊 Format: ${exportFormat.toUpperCase()}`));
        return;
      } catch (error) {
        console.error(chalk.red(`❌ Failed to export data: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    }
    
    // Show summary info
    console.log(chalk.cyan('📊 Claude Unified Dashboard'));
    
    if (unifiedData.projects) {
      console.log(chalk.white(`\n📁 Projects: ${chalk.bold(unifiedData.projects.metadata.totalProjects)}`));
      console.log(chalk.white(`📝 Total entries: ${chalk.bold(unifiedData.projects.metadata.totalEntries)}`));
      console.log(chalk.white(`⚡ Executions tracked: ${chalk.bold(unifiedData.projects.metadata.totalExecutions)}`));
    }
    
    if (unifiedData.usage) {
      console.log(chalk.white(`\n💰 Total cost: ${chalk.bold('$' + unifiedData.usage.totals.totalCost.toFixed(2))}`));
      console.log(chalk.white(`📅 Date range: ${chalk.bold(unifiedData.usage.metadata.dateRange.start)} to ${chalk.bold(unifiedData.usage.metadata.dateRange.end)}`));
      console.log(chalk.white(`🎯 Peak usage: ${chalk.bold('$' + unifiedData.usage.metadata.peakUsage.cost.toFixed(2))} on ${unifiedData.usage.metadata.peakUsage.date}`));
    }
    
    console.log();
    
    // Generate and open dashboard
    await generateDashboard(unifiedData);
    
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error(chalk.red('Error: Invalid JSON in usage data file'));
      console.error(chalk.yellow('Please check the format of .data/usage.json'));
    } else {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    }
    process.exit(1);
  }
}

function generateCSVExport(data: ProcessedUsageData): string {
  const headers = [
    'Date',
    'Input Tokens',
    'Output Tokens', 
    'Cache Creation Tokens',
    'Cache Read Tokens',
    'Total Tokens',
    'Total Cost',
    'Models Used'
  ];
  
  const csvLines = [headers.join(',')];
  
  data.daily.forEach(day => {
    const row = [
      day.date,
      day.inputTokens.toString(),
      day.outputTokens.toString(),
      day.cacheCreationTokens.toString(),
      day.cacheReadTokens.toString(),
      day.totalTokens.toString(),
      day.totalCost.toFixed(6),
      `"${day.modelsUsed.join(', ')}"`
    ];
    csvLines.push(row.join(','));
  });
  
  return csvLines.join('\n');
}