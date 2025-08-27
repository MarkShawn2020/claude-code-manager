import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import chalk from 'chalk';

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const DEFAULT_STATUSLINE_PATH = path.join(CLAUDE_DIR, 'statusline.sh');
const SETTINGS_PATH = path.join(CLAUDE_DIR, 'settings.json');

// Function to get the modules directory path
function getModulesDir(): string {
  // When installed via npm, modules are in node_modules/claude-code-manager/modules
  // When running locally, modules are in the project root
  const possiblePaths = [
    path.join(__dirname, '..', '..', 'modules', 'statusline'), // Local development
    path.join(__dirname, '..', '..', '..', 'modules', 'statusline'), // NPM installed (if compiled to dist)
    path.join(process.cwd(), 'node_modules', 'claude-code-manager', 'modules', 'statusline'), // NPM global
    path.join(process.cwd(), 'modules', 'statusline'), // Local project
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Fallback to local development path
  return path.join(__dirname, '..', '..', 'modules', 'statusline');
}

// Function to list available statuslines
function getAvailableStatuslines(): { name: string; path: string; description?: string }[] {
  const modulesDir = getModulesDir();
  
  if (!fs.existsSync(modulesDir)) {
    return [];
  }

  const files = fs.readdirSync(modulesDir);
  const statuslines = files
    .filter(file => file.endsWith('.sh'))
    .map(file => {
      const filePath = path.join(modulesDir, file);
      const name = path.basename(file, '.sh');
      
      // Try to extract description from the file (look for first comment after shebang)
      let description = '';
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        for (let i = 1; i < Math.min(10, lines.length); i++) {
          if (lines[i].startsWith('# Description:')) {
            description = lines[i].replace('# Description:', '').trim();
            break;
          }
        }
      } catch (e) {
        // Ignore errors reading description
      }

      return {
        name,
        path: filePath,
        description
      };
    });

  return statuslines;
}

export function createStatuslineCommand() {
  const statusline = new Command('statusline')
    .description('Manage Claude Code statusline configurations')
    .alias('sl');

  // List subcommand - Show available statuslines
  statusline
    .command('list')
    .description('List all available statuslines')
    .action(() => {
      try {
        const statuslines = getAvailableStatuslines();
        
        if (statuslines.length === 0) {
          console.log(chalk.yellow('⚠️  No statuslines found'));
          console.log(chalk.gray(`  Modules directory: ${getModulesDir()}`));
          return;
        }

        // Check which one is currently active
        let activeStatusline = '';
        if (fs.existsSync(DEFAULT_STATUSLINE_PATH)) {
          try {
            const stats = fs.lstatSync(DEFAULT_STATUSLINE_PATH);
            if (stats.isSymbolicLink()) {
              const target = fs.readlinkSync(DEFAULT_STATUSLINE_PATH);
              activeStatusline = path.basename(target, '.sh');
            } else {
              // It's a regular file, check if it matches any of our statuslines
              const content = fs.readFileSync(DEFAULT_STATUSLINE_PATH, 'utf-8');
              for (const sl of statuslines) {
                const slContent = fs.readFileSync(sl.path, 'utf-8');
                if (content === slContent) {
                  activeStatusline = sl.name;
                  break;
                }
              }
            }
          } catch (e) {
            // Ignore errors
          }
        }

        console.log(chalk.cyan('📊 Available Statuslines:\n'));
        
        statuslines.forEach(sl => {
          const isActive = sl.name === activeStatusline;
          const marker = isActive ? chalk.green('✓') : ' ';
          const name = isActive ? chalk.green(sl.name) : chalk.white(sl.name);
          
          console.log(`  ${marker} ${name}`);
          if (sl.description) {
            console.log(chalk.gray(`    ${sl.description}`));
          }
          console.log(chalk.gray(`    Path: ${sl.path}`));
        });

        if (activeStatusline && !statuslines.find(sl => sl.name === activeStatusline)) {
          console.log(chalk.yellow('\n⚠️  Active statusline is custom or modified'));
        }
      } catch (error) {
        console.error(chalk.red('✗ Failed to list statuslines:'), error);
        process.exit(1);
      }
    });

  // Select subcommand - Choose a statusline
  statusline
    .command('select <name>')
    .description('Select and activate a statusline')
    .option('-s, --symlink', 'Use symlink instead of copying (default)')
    .option('-c, --copy', 'Copy the file instead of symlinking')
    .action(async (name, options) => {
      try {
        const statuslines = getAvailableStatuslines();
        const selected = statuslines.find(sl => sl.name === name);

        if (!selected) {
          console.log(chalk.red(`✗ Statusline '${name}' not found`));
          console.log(chalk.gray('\nAvailable statuslines:'));
          statuslines.forEach(sl => {
            console.log(chalk.gray(`  - ${sl.name}`));
          });
          process.exit(1);
        }

        // Ensure Claude directory exists
        if (!fs.existsSync(CLAUDE_DIR)) {
          fs.mkdirSync(CLAUDE_DIR, { recursive: true });
        }

        // Backup existing statusline if it exists and is not a symlink
        if (fs.existsSync(DEFAULT_STATUSLINE_PATH)) {
          try {
            const stats = fs.lstatSync(DEFAULT_STATUSLINE_PATH);
            if (!stats.isSymbolicLink()) {
              const backupPath = `${DEFAULT_STATUSLINE_PATH}.backup.${Date.now()}`;
              fs.renameSync(DEFAULT_STATUSLINE_PATH, backupPath);
              console.log(chalk.green(`✓ Created backup: ${backupPath}`));
            } else {
              // Remove existing symlink
              fs.unlinkSync(DEFAULT_STATUSLINE_PATH);
            }
          } catch (err) {
            // Force remove if there's an issue
            try {
              fs.unlinkSync(DEFAULT_STATUSLINE_PATH);
            } catch (e) {
              console.log(chalk.yellow('⚠️  Could not remove existing statusline, will try to overwrite'));
            }
          }
        }

        // Create symlink or copy
        if (options.copy) {
          fs.copyFileSync(selected.path, DEFAULT_STATUSLINE_PATH);
          fs.chmodSync(DEFAULT_STATUSLINE_PATH, 0o755);
          console.log(chalk.green(`✓ Copied '${name}' statusline to ${DEFAULT_STATUSLINE_PATH}`));
        } else {
          // Use symlink by default
          // Always try to remove existing file first, regardless of whether we can detect it
          try {
            fs.unlinkSync(DEFAULT_STATUSLINE_PATH);
            console.log(chalk.gray('  Removed existing statusline'));
          } catch (err: any) {
            // If ENOENT (file doesn't exist), that's fine
            if (err.code !== 'ENOENT') {
              // Try force remove using rm command for other errors
              try {
                require('child_process').execSync(`rm -f "${DEFAULT_STATUSLINE_PATH}"`);
                console.log(chalk.gray('  Force removed existing statusline'));
              } catch (e) {
                // Ignore - we'll try to create the symlink anyway
              }
            }
          }
          
          try {
            fs.symlinkSync(selected.path, DEFAULT_STATUSLINE_PATH);
            console.log(chalk.green(`✓ Selected '${name}' statusline (symlinked)`));
          } catch (err: any) {
            // If it still fails, try one more force remove and retry
            if (err.code === 'EEXIST') {
              try {
                require('child_process').execSync(`rm -f "${DEFAULT_STATUSLINE_PATH}"`);
                fs.symlinkSync(selected.path, DEFAULT_STATUSLINE_PATH);
                console.log(chalk.green(`✓ Selected '${name}' statusline (symlinked) after force cleanup`));
              } catch (finalErr: any) {
                console.log(chalk.red(`✗ Failed to create symlink: ${finalErr.message}`));
                console.log(chalk.gray(`  Source: ${selected.path}`));
                console.log(chalk.gray(`  Target: ${DEFAULT_STATUSLINE_PATH}`));
                console.log(chalk.gray('\nTry running: rm -f ~/.claude/statusline.sh'));
                process.exit(1);
              }
            } else {
              console.log(chalk.red(`✗ Failed to create symlink: ${err.message}`));
              console.log(chalk.gray(`  Source: ${selected.path}`));
              console.log(chalk.gray(`  Target: ${DEFAULT_STATUSLINE_PATH}`));
              process.exit(1);
            }
          }
        }

        // Update settings.json if needed
        let settings: any = {};
        if (fs.existsSync(SETTINGS_PATH)) {
          try {
            const content = fs.readFileSync(SETTINGS_PATH, 'utf-8');
            settings = JSON.parse(content);
          } catch (error) {
            console.log(chalk.yellow('⚠️  Could not parse existing settings.json'));
          }
        }

        // Only update if statusLine is not configured or path is different
        if (!settings.statusLine || settings.statusLine.command !== DEFAULT_STATUSLINE_PATH) {
          settings.statusLine = {
            type: 'command',
            command: DEFAULT_STATUSLINE_PATH,
            padding: settings.statusLine?.padding ?? 0
          };
          fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
          console.log(chalk.green('✓ Updated settings.json'));
        }

        console.log(chalk.gray('\n💡 Restart Claude Code for changes to take effect'));
      } catch (error) {
        console.error(chalk.red('✗ Failed to select statusline:'), error);
        process.exit(1);
      }
    });

  // Init subcommand - Install the default statusline
  statusline
    .command('init')
    .description('Install the default statusline to ~/.claude/')
    .option('-n, --name <name>', 'Select a specific statusline', 'statusline')
    .option('-f, --force', 'Force overwrite existing statusline')
    .option('-b, --backup', 'Create backup if statusline exists')
    .action(async (options) => {
      try {
        const statuslines = getAvailableStatuslines();
        
        if (statuslines.length === 0) {
          console.log(chalk.red('✗ No statuslines found in modules directory'));
          console.log(chalk.gray(`  Checked: ${getModulesDir()}`));
          process.exit(1);
        }

        // Find the requested statusline
        let selected = statuslines.find(sl => sl.name === options.name);
        if (!selected) {
          // Fallback to first available
          selected = statuslines[0];
          console.log(chalk.yellow(`⚠️  Statusline '${options.name}' not found, using '${selected.name}'`));
        }

        // Ensure Claude directory exists
        if (!fs.existsSync(CLAUDE_DIR)) {
          fs.mkdirSync(CLAUDE_DIR, { recursive: true });
          console.log(chalk.green(`✓ Created directory: ${CLAUDE_DIR}`));
        }

        // Check if statusline already exists
        if (fs.existsSync(DEFAULT_STATUSLINE_PATH)) {
          if (!options.force && !options.backup) {
            console.log(chalk.yellow(`⚠️  Statusline already exists at: ${DEFAULT_STATUSLINE_PATH}`));
            console.log(chalk.gray('Use --force to overwrite or --backup to create a backup'));
            console.log(chalk.gray(`Or use 'ccm statusline select ${options.name}' to switch statuslines`));
            process.exit(1);
          }

          if (options.backup) {
            const backupPath = `${DEFAULT_STATUSLINE_PATH}.backup.${Date.now()}`;
            fs.renameSync(DEFAULT_STATUSLINE_PATH, backupPath);
            console.log(chalk.green(`✓ Created backup: ${backupPath}`));
          } else if (options.force) {
            // Remove existing file/symlink
            fs.unlinkSync(DEFAULT_STATUSLINE_PATH);
          }
        }

        // Create symlink to selected statusline
        // Ensure any existing file is removed first
        if (fs.existsSync(DEFAULT_STATUSLINE_PATH)) {
          try {
            fs.unlinkSync(DEFAULT_STATUSLINE_PATH);
          } catch (e) {
            // Ignore errors
          }
        }
        fs.symlinkSync(selected.path, DEFAULT_STATUSLINE_PATH);
        console.log(chalk.green(`✓ Installed '${selected.name}' statusline to: ${DEFAULT_STATUSLINE_PATH}`));
        
        console.log(chalk.gray('\nNext steps:'));
        console.log(chalk.gray(`  1. Run: ${chalk.cyan('ccm statusline enable')} to activate the statusline`));
        console.log(chalk.gray(`  2. Run: ${chalk.cyan('ccm statusline list')} to see all available statuslines`));
        console.log(chalk.gray(`  3. Run: ${chalk.cyan('ccm statusline select <name>')} to switch statuslines`));
      } catch (error) {
        console.error(chalk.red('✗ Failed to install statusline:'), error);
        process.exit(1);
      }
    });

  // Enable subcommand - Update settings.json to use the statusline
  statusline
    .command('enable')
    .description('Enable the statusline in Claude Code settings')
    .option('-p, --path <path>', 'Path to statusline script', DEFAULT_STATUSLINE_PATH)
    .option('--padding <number>', 'Padding for statusline', '0')
    .action(async (options) => {
      try {
        const statuslinePath = path.resolve(options.path);

        // Check if statusline exists
        if (!fs.existsSync(statuslinePath)) {
          console.log(chalk.yellow(`⚠️  Statusline not found at: ${statuslinePath}`));
          console.log(chalk.gray(`Run '${chalk.cyan('ccm statusline init')}' to install the statusline first`));
          process.exit(1);
        }

        // Ensure Claude directory exists
        if (!fs.existsSync(CLAUDE_DIR)) {
          fs.mkdirSync(CLAUDE_DIR, { recursive: true });
        }

        // Read or create settings
        let settings: any = {};
        if (fs.existsSync(SETTINGS_PATH)) {
          try {
            const content = fs.readFileSync(SETTINGS_PATH, 'utf-8');
            settings = JSON.parse(content);
          } catch (error) {
            console.log(chalk.yellow('⚠️  Could not parse existing settings.json, will create new one'));
          }
        }

        // Update statusLine configuration
        settings.statusLine = {
          type: 'command',
          command: statuslinePath,
          padding: parseInt(options.padding)
        };

        // Write updated settings
        fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
        
        console.log(chalk.green(`✓ Statusline enabled in settings.json`));
        console.log(chalk.gray(`  Command: ${statuslinePath}`));
        console.log(chalk.gray(`  Padding: ${options.padding}`));
        console.log(chalk.gray('\n💡 Restart Claude Code for changes to take effect'));
      } catch (error) {
        console.error(chalk.red('✗ Failed to enable statusline:'), error);
        process.exit(1);
      }
    });

  // Disable subcommand - Remove statusline from settings.json
  statusline
    .command('disable')
    .description('Disable the statusline in Claude Code settings')
    .option('--keep-file', 'Keep the statusline.sh file (only remove from settings)')
    .action(async (options) => {
      try {
        if (!fs.existsSync(SETTINGS_PATH)) {
          console.log(chalk.yellow('⚠️  No settings.json found'));
          console.log(chalk.gray('Statusline is already disabled'));
          return;
        }

        // Read settings
        const content = fs.readFileSync(SETTINGS_PATH, 'utf-8');
        const settings = JSON.parse(content);

        if (!settings.statusLine) {
          console.log(chalk.yellow('⚠️  Statusline is already disabled'));
          return;
        }

        // Remove statusLine from settings
        delete settings.statusLine;

        // Write updated settings
        fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
        
        console.log(chalk.green('✓ Statusline disabled in settings.json'));

        if (!options.keepFile && fs.existsSync(DEFAULT_STATUSLINE_PATH)) {
          console.log(chalk.gray(`\n💡 The statusline file still exists at: ${DEFAULT_STATUSLINE_PATH}`));
          console.log(chalk.gray(`   Run '${chalk.cyan('rm ' + DEFAULT_STATUSLINE_PATH)}' to remove it`));
        }

        console.log(chalk.gray('\n💡 Restart Claude Code for changes to take effect'));
      } catch (error) {
        console.error(chalk.red('✗ Failed to disable statusline:'), error);
        process.exit(1);
      }
    });

  // Test subcommand - Test the statusline with mock data
  statusline
    .command('test')
    .description('Test the statusline with mock data')
    .option('-n, --name <name>', 'Test a specific statusline')
    .option('-p, --path <path>', 'Path to statusline script', DEFAULT_STATUSLINE_PATH)
    .option('-s, --session-id <id>', 'Mock session ID', 'test-session-123')
    .option('-m, --model <name>', 'Mock model name', 'Opus')
    .option('-c, --cost <amount>', 'Mock cost in USD', '0.123')
    .option('-d, --duration <ms>', 'Mock duration in milliseconds', '45000')
    .action(async (options) => {
      try {
        let statuslinePath = path.resolve(options.path);

        // If testing a specific statusline by name
        if (options.name) {
          const statuslines = getAvailableStatuslines();
          const selected = statuslines.find(sl => sl.name === options.name);
          if (selected) {
            statuslinePath = selected.path;
          } else {
            console.log(chalk.red(`✗ Statusline '${options.name}' not found`));
            process.exit(1);
          }
        }

        // Check if statusline exists
        if (!fs.existsSync(statuslinePath)) {
          console.log(chalk.yellow(`⚠️  Statusline not found at: ${statuslinePath}`));
          console.log(chalk.gray(`Run '${chalk.cyan('ccm statusline init')}' to install the statusline first`));
          process.exit(1);
        }

        // Create mock data matching the expected JSON structure
        const mockData = {
          hook_event_name: 'Status',
          session_id: options.sessionId,
          transcript_path: '/tmp/test-transcript.json',
          cwd: process.cwd(),
          model: {
            id: 'claude-opus-4-1',
            display_name: options.model
          },
          workspace: {
            current_dir: process.cwd(),
            project_dir: process.cwd()
          },
          version: '1.0.80',
          output_style: {
            name: 'default'
          },
          cost: {
            total_cost_usd: parseFloat(options.cost),
            total_duration_ms: parseInt(options.duration),
            total_api_duration_ms: 2300,
            total_lines_added: 156,
            total_lines_removed: 23
          }
        };

        console.log(chalk.cyan('🧪 Testing statusline with mock data:'));
        if (options.name) {
          console.log(chalk.gray(`  Statusline: ${options.name}`));
        }
        console.log(chalk.gray(JSON.stringify(mockData, null, 2)));
        console.log(chalk.cyan('\n📊 Statusline output:'));
        
        // Execute the statusline with mock data
        try {
          const result = execSync(`echo '${JSON.stringify(mockData)}' | ${statuslinePath}`, {
            encoding: 'utf-8',
            shell: '/bin/bash'
          });
          
          // The result already contains ANSI codes, so we just print it
          console.log(result);
          
          console.log(chalk.green('\n✓ Statusline test completed successfully'));
        } catch (execError) {
          console.error(chalk.red('✗ Statusline execution failed:'), execError);
          console.log(chalk.gray('\nMake sure the statusline script has proper permissions:'));
          console.log(chalk.gray(`  chmod +x ${statuslinePath}`));
        }
      } catch (error) {
        console.error(chalk.red('✗ Failed to test statusline:'), error);
        process.exit(1);
      }
    });

  // Status subcommand - Show current statusline configuration
  statusline
    .command('status')
    .description('Show current statusline configuration')
    .action(async () => {
      try {
        console.log(chalk.cyan('📊 Claude Code Statusline Configuration\n'));

        // Check if settings.json exists
        if (!fs.existsSync(SETTINGS_PATH)) {
          console.log(chalk.yellow('⚠️  No settings.json found'));
          console.log(chalk.gray('  Statusline is not configured'));
          return;
        }

        // Read settings
        const content = fs.readFileSync(SETTINGS_PATH, 'utf-8');
        const settings = JSON.parse(content);

        if (!settings.statusLine) {
          console.log(chalk.yellow('⚠️  Statusline is disabled'));
          console.log(chalk.gray(`  Run '${chalk.cyan('ccm statusline enable')}' to enable it`));
        } else {
          console.log(chalk.green('✓ Statusline is enabled'));
          console.log(chalk.gray(`  Type: ${settings.statusLine.type}`));
          console.log(chalk.gray(`  Command: ${settings.statusLine.command}`));
          console.log(chalk.gray(`  Padding: ${settings.statusLine.padding ?? 'default'}`));

          // Check if the statusline file exists
          if (settings.statusLine.command && !fs.existsSync(settings.statusLine.command)) {
            console.log(chalk.red(`\n⚠️  Warning: Statusline file not found at: ${settings.statusLine.command}`));
            console.log(chalk.gray(`  Run '${chalk.cyan('ccm statusline init')}' to reinstall`));
          }
        }

        // Check active statusline
        if (fs.existsSync(DEFAULT_STATUSLINE_PATH)) {
          console.log(chalk.cyan('\n📁 Active statusline:'));
          try {
            const stats = fs.lstatSync(DEFAULT_STATUSLINE_PATH);
            if (stats.isSymbolicLink()) {
              const target = fs.readlinkSync(DEFAULT_STATUSLINE_PATH);
              console.log(chalk.gray(`  Symlink → ${target}`));
              console.log(chalk.gray(`  Name: ${path.basename(target, '.sh')}`));
            } else {
              console.log(chalk.gray(`  Regular file at ${DEFAULT_STATUSLINE_PATH}`));
            }
          } catch (e) {
            console.log(chalk.gray('  Could not determine statusline type'));
          }
        }

        // List available statuslines
        const statuslines = getAvailableStatuslines();
        if (statuslines.length > 0) {
          console.log(chalk.cyan('\n📚 Available statuslines:'));
          statuslines.forEach(sl => {
            console.log(chalk.gray(`  - ${sl.name}`));
          });
          console.log(chalk.gray(`\n  Run '${chalk.cyan('ccm statusline list')}' for details`));
          console.log(chalk.gray(`  Run '${chalk.cyan('ccm statusline select <name>')}' to switch`));
        }
      } catch (error) {
        console.error(chalk.red('✗ Failed to check statusline status:'), error);
        process.exit(1);
      }
    });

  return statusline;
}