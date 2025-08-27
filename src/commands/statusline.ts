import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import chalk from 'chalk';

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const DEFAULT_STATUSLINE_PATH = path.join(CLAUDE_DIR, 'statusline.sh');
const SETTINGS_PATH = path.join(CLAUDE_DIR, 'settings.json');
const SOURCE_STATUSLINE_PATH = path.join(__dirname, '..', '..', 'modules', 'statusline', 'statusline.sh');

export function createStatuslineCommand() {
  const statusline = new Command('statusline')
    .description('Manage Claude Code statusline configurations')
    .alias('sl');

  // Init subcommand - Install the statusline script
  statusline
    .command('init')
    .description('Install the statusline script to ~/.claude/')
    .option('-p, --path <path>', 'Custom installation path', DEFAULT_STATUSLINE_PATH)
    .option('-f, --force', 'Force overwrite existing statusline')
    .option('-b, --backup', 'Create backup if statusline exists')
    .action(async (options) => {
      try {
        const targetPath = path.resolve(options.path);
        const targetDir = path.dirname(targetPath);

        // Ensure target directory exists
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
          console.log(chalk.green(`✓ Created directory: ${targetDir}`));
        }

        // Check if statusline already exists
        if (fs.existsSync(targetPath)) {
          if (!options.force && !options.backup) {
            console.log(chalk.yellow(`⚠️  Statusline already exists at: ${targetPath}`));
            console.log(chalk.gray('Use --force to overwrite or --backup to create a backup'));
            process.exit(1);
          }

          if (options.backup) {
            const backupPath = `${targetPath}.backup.${Date.now()}`;
            fs.copyFileSync(targetPath, backupPath);
            console.log(chalk.green(`✓ Created backup: ${backupPath}`));
          }
        }

        // Check if source statusline exists
        if (!fs.existsSync(SOURCE_STATUSLINE_PATH)) {
          console.log(chalk.red(`✗ Source statusline not found at: ${SOURCE_STATUSLINE_PATH}`));
          console.log(chalk.gray('Please ensure the modules/statusline/statusline.sh file exists'));
          process.exit(1);
        }

        // Copy statusline to target location
        fs.copyFileSync(SOURCE_STATUSLINE_PATH, targetPath);
        
        // Make it executable
        fs.chmodSync(targetPath, 0o755);
        
        console.log(chalk.green(`✓ Statusline installed to: ${targetPath}`));
        console.log(chalk.gray('\nNext steps:'));
        console.log(chalk.gray(`  1. Run: ${chalk.cyan('ccm statusline enable')} to activate the statusline`));
        console.log(chalk.gray(`  2. Or manually add to ~/.claude/settings.json:`));
        console.log(chalk.gray(`     {`));
        console.log(chalk.gray(`       "statusLine": {`));
        console.log(chalk.gray(`         "type": "command",`));
        console.log(chalk.gray(`         "command": "${targetPath}",`));
        console.log(chalk.gray(`         "padding": 0`));
        console.log(chalk.gray(`       }`));
        console.log(chalk.gray(`     }`));
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
    .option('-p, --path <path>', 'Path to statusline script', DEFAULT_STATUSLINE_PATH)
    .option('-s, --session-id <id>', 'Mock session ID', 'test-session-123')
    .option('-m, --model <name>', 'Mock model name', 'Opus')
    .option('-c, --cost <amount>', 'Mock cost in USD', '0.123')
    .option('-d, --duration <ms>', 'Mock duration in milliseconds', '45000')
    .action(async (options) => {
      try {
        const statuslinePath = path.resolve(options.path);

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

        // Check for installed statusline files
        console.log(chalk.cyan('\n📁 Installed statusline files:'));
        
        const commonPaths = [
          DEFAULT_STATUSLINE_PATH,
          path.join(CLAUDE_DIR, 'statusline.sh'),
          path.join(CLAUDE_DIR, 'custom-statusline.sh')
        ];

        let foundAny = false;
        for (const statuslinePath of commonPaths) {
          if (fs.existsSync(statuslinePath)) {
            const stats = fs.statSync(statuslinePath);
            const isExecutable = (stats.mode & 0o100) !== 0;
            console.log(chalk.gray(`  ${statuslinePath} ${isExecutable ? '(executable)' : '(not executable)'}`));
            foundAny = true;
          }
        }

        if (!foundAny) {
          console.log(chalk.gray('  No statusline files found'));
          console.log(chalk.gray(`  Run '${chalk.cyan('ccm statusline init')}' to install one`));
        }
      } catch (error) {
        console.error(chalk.red('✗ Failed to check statusline status:'), error);
        process.exit(1);
      }
    });

  return statusline;
}