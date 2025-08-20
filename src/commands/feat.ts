import { Command } from 'commander';
import { execSync, spawn } from 'child_process';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import os from 'os';
import inquirer from 'inquirer';

interface WorktreeInfo {
  path: string;
  branch: string;
  commit: string;
  isActive: boolean;
  isLocked: boolean;
  reason?: string;
}

function getWorktrees(): WorktreeInfo[] {
  try {
    const output = execSync('git worktree list --porcelain', { encoding: 'utf8' });
    const worktrees: WorktreeInfo[] = [];
    let current: Partial<WorktreeInfo> = {};
    
    output.split('\n').forEach(line => {
      if (line.startsWith('worktree ')) {
        if (current.path) {
          worktrees.push(current as WorktreeInfo);
        }
        current = {
          path: line.substring(9),
          isActive: true,
          isLocked: false
        };
      } else if (line.startsWith('HEAD ')) {
        current.commit = line.substring(5);
      } else if (line.startsWith('branch ')) {
        current.branch = line.substring(7).replace('refs/heads/', '');
      } else if (line === 'detached') {
        current.branch = '(detached)';
      } else if (line.startsWith('locked')) {
        current.isLocked = true;
        if (line.includes(' ')) {
          current.reason = line.substring(7);
        }
      } else if (line === 'prunable') {
        current.isActive = false;
      }
    });
    
    if (current.path) {
      worktrees.push(current as WorktreeInfo);
    }
    
    return worktrees;
  } catch (error) {
    console.error(chalk.red('Error: Not in a git repository'));
    process.exit(1);
  }
}

function getMainBranch(): string {
  try {
    const remoteHead = execSync('git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null', { encoding: 'utf8' }).trim();
    if (remoteHead) {
      return remoteHead.replace('refs/remotes/origin/', '');
    }
  } catch {}
  
  try {
    const branches = execSync('git branch -a', { encoding: 'utf8' });
    if (branches.includes('main')) return 'main';
    if (branches.includes('master')) return 'master';
  } catch {}
  
  return 'main';
}

function getCurrentBranch(): string {
  try {
    return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function featAddCommand(name: string, options: { path?: string; parent?: boolean }) {
  if (!name) {
    console.error(chalk.red('Error: Feature name is required'));
    process.exit(1);
  }
  
  const mainBranch = getMainBranch();
  const branchName = `feat/${name}`;
  
  // Determine worktree path based on options
  let worktreePath: string;
  if (options.path) {
    // Use custom path
    worktreePath = path.resolve(options.path);
  } else if (options.parent) {
    // Use parent directory (following official docs)
    const projectName = path.basename(process.cwd());
    worktreePath = path.join(process.cwd(), '..', `${projectName}-${name}`);
  } else {
    // Default: use .feats directory inside project
    worktreePath = path.join(process.cwd(), '.feats', name);
  }
  
  try {
    execSync(`git fetch origin ${mainBranch}`, { stdio: 'inherit' });
    
    console.log(chalk.cyan(`Creating worktree for feature: ${name}`));
    console.log(chalk.dim(`  Branch: ${branchName}`));
    console.log(chalk.dim(`  Path: ${worktreePath}`));
    
    execSync(`git worktree add -b ${branchName} "${worktreePath}" origin/${mainBranch}`, { stdio: 'inherit' });
    
    console.log(chalk.green(`✓ Worktree created successfully\n`));
    
    // Change to the worktree directory
    process.chdir(worktreePath);
    console.log(chalk.cyan(`📁 Switched to: ${worktreePath}`));
    
    // Launch Claude Code in the current directory
    console.log(chalk.cyan(`🚀 Launching Claude Code...`));
    const child = spawn('claude', [], { 
      stdio: 'inherit',
      shell: true
    });
    
    // The parent process will stay in the worktree directory
    // So when claude exits, the user is already in the right place
    
  } catch (error) {
    console.error(chalk.red(`Error creating worktree: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

async function featListCommand(options: { all?: boolean; simple?: boolean }) {
  const worktrees = getWorktrees();
  const currentPath = process.cwd();
  
  if (worktrees.length === 0) {
    console.log(chalk.yellow('No worktrees found'));
    return;
  }
  
  // If --simple flag is used, show the old static list
  if (options.simple) {
    showStaticList(worktrees, currentPath, options.all);
    return;
  }
  
  try {
  
  // Interactive mode
  const mainWorktree = worktrees.find(w => !w.branch.includes('feat/'));
  const featureWorktrees = worktrees.filter(w => w.branch.includes('feat/'));
  
  // Only show feature worktrees, not main
  let displayWorktrees = featureWorktrees;
  
  // Filter based on --all flag (only apply to feature worktrees)
  if (!options.all) {
    displayWorktrees = displayWorktrees.filter(w => w.isActive !== false);
  }
  
  // If no feature worktrees exist
  if (displayWorktrees.length === 0) {
    console.log(chalk.yellow('\nNo feature worktrees found'));
    console.log(chalk.dim('Use "ccm feat add <name>" to create one'));
    return;
  }
  
  // Create choices for inquirer
  const choices: any[] = displayWorktrees.map(wt => {
    const isCurrent = path.resolve(wt.path) === path.resolve(currentPath);
    const name = wt.branch.replace('feat/', ''); // All should be features now
    
    let status = '';
    if (isCurrent) status += chalk.green(' ●');
    if (!wt.isActive) status += chalk.gray(' ◌');
    if (wt.isLocked) status += chalk.yellow(' 🔒');
    
    const label = `${chalk.bold(name)}${status} ${chalk.dim(`(${wt.commit.substring(0, 8)})`)}`;
    
    return {
      name: label,
      value: wt,
      short: name
    };
  });
  
  // Add separator and action options
  choices.push(new inquirer.Separator(chalk.dim('─'.repeat(40))));
  choices.push({
    name: chalk.gray('← Exit'),
    value: null,
    short: 'Exit'
  });
  
  console.log(chalk.cyan.bold('\n📂 Git Worktrees\n'));
  
  const { selectedWorktree } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedWorktree',
      message: 'Select a worktree to enter:',
      choices,
      pageSize: 15,
      loop: false
    }
  ]);
  
  if (!selectedWorktree) {
    console.log(chalk.dim('Exited'));
    return;
  }
  
  // Show action menu for the selected worktree
  const actions: any[] = [
    { name: '🚀 Launch Claude Code', value: 'claude' },
    { name: '🗑️  Remove worktree', value: 'remove' },
    new inquirer.Separator(chalk.dim('─'.repeat(40))),
    { name: '← Back', value: 'back' }
  ];
  
  const branchDisplay = selectedWorktree.branch.includes('feat/') 
    ? selectedWorktree.branch.replace('feat/', '') 
    : selectedWorktree.branch;
    
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: `Selected: ${chalk.bold.cyan(branchDisplay)}`,
      choices: actions
    }
  ]);
  
  switch (action) {
    case 'claude':
      console.log(chalk.cyan(`\n📁 Switching to: ${selectedWorktree.path}`));
      process.chdir(selectedWorktree.path);
      console.log(chalk.cyan('🚀 Launching Claude Code...'));
      spawn('claude', [], { 
        stdio: 'inherit',
        shell: true
      });
      break;
      
    case 'remove':
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Are you sure you want to remove ${selectedWorktree.branch}?`,
          default: false
        }
      ]);
      
      if (confirm) {
        try {
          // Remove the worktree
          console.log(chalk.cyan('Removing worktree...'));
          execSync(`git worktree remove "${selectedWorktree.path}" --force`, { stdio: 'pipe' });
          console.log(chalk.green(`✓ Removed worktree: ${selectedWorktree.path}`));
          
          // Also remove the branch
          try {
            execSync(`git branch -D ${selectedWorktree.branch}`, { stdio: 'pipe' });
            console.log(chalk.green(`✓ Deleted branch: ${selectedWorktree.branch}`));
          } catch {
            // Branch might not exist or might have unmerged changes
            console.log(chalk.yellow(`⚠ Could not delete branch ${selectedWorktree.branch} (may have unmerged changes)`));
          }
          
          console.log(''); // Add blank line for clarity
        } catch (error) {
          console.error(chalk.red(`Failed to remove worktree: ${error}`));
        }
      } else {
        console.log(chalk.dim('Cancelled'));
      }
      
      // Always return to the list after removal attempt
      await featListCommand(options);
      break;
      
    case 'back':
      // Recursively call the list command
      await featListCommand(options);
      break;
  }
  
  } catch (error: any) {
    // Handle user cancellation gracefully
    if (error.name === 'ExitPromptError' || error.message?.includes('SIGINT')) {
      console.log(chalk.dim('\nExited'));
      process.exit(0);
    }
    // Re-throw other errors
    throw error;
  }
}

// Helper function to show static list (old behavior)
function showStaticList(worktrees: WorktreeInfo[], currentPath: string, showAll?: boolean) {
  const mainWorktree = worktrees.find(w => !w.branch.includes('feat/'));
  const featureWorktrees = worktrees.filter(w => w.branch.includes('feat/'));
  
  console.log(chalk.bold('\nWorktrees:'));
  console.log(chalk.dim('─'.repeat(60)));
  
  if (mainWorktree) {
    const isCurrent = path.resolve(mainWorktree.path) === path.resolve(currentPath);
    const status = isCurrent ? chalk.green(' (current)') : '';
    console.log(`${chalk.blue('▸')} ${chalk.bold('main')}`);
    console.log(`  ${chalk.dim('Path:')} ${mainWorktree.path}${status}`);
    console.log(`  ${chalk.dim('Branch:')} ${mainWorktree.branch}`);
    console.log(`  ${chalk.dim('Commit:')} ${mainWorktree.commit.substring(0, 8)}`);
  }
  
  if (featureWorktrees.length > 0) {
    console.log(chalk.dim('\n─ Features ─'));
    
    featureWorktrees.forEach(wt => {
      if (!showAll && !wt.isActive) {
        return;
      }
      
      const isCurrent = path.resolve(wt.path) === path.resolve(currentPath);
      const featName = wt.branch.replace('feat/', '');
      const statusIcons = [];
      
      if (isCurrent) statusIcons.push(chalk.green('●'));
      if (!wt.isActive) statusIcons.push(chalk.gray('◌'));
      if (wt.isLocked) statusIcons.push(chalk.yellow('🔒'));
      
      const statusStr = statusIcons.length > 0 ? ` ${statusIcons.join(' ')}` : '';
      
      console.log(`\n${chalk.cyan('▸')} ${chalk.bold(featName)}${statusStr}`);
      console.log(`  ${chalk.dim('Path:')} ${wt.path}`);
      console.log(`  ${chalk.dim('Branch:')} ${wt.branch}`);
      console.log(`  ${chalk.dim('Commit:')} ${wt.commit.substring(0, 8)}`);
      
      if (wt.isLocked && wt.reason) {
        console.log(`  ${chalk.yellow('Locked:')} ${wt.reason}`);
      }
      
      if (!wt.isActive) {
        console.log(`  ${chalk.gray('Status: Prunable (can be removed)')}`);
      }
    });
  }
  
  if (!showAll) {
    const inactiveCount = featureWorktrees.filter(w => !w.isActive).length;
    if (inactiveCount > 0) {
      console.log(chalk.dim(`\n${inactiveCount} inactive worktree(s) hidden. Use -a to show all.`));
    }
  }
  
  console.log(chalk.dim('\n─'.repeat(60)));
  console.log(chalk.dim('Legend: ● current | ◌ inactive | 🔒 locked'));
}

function featMergeCommand() {
  const worktrees = getWorktrees();
  const mainBranch = getMainBranch();
  const currentBranch = getCurrentBranch();
  const featureWorktrees = worktrees.filter(w => w.branch.includes('feat/'));
  
  if (featureWorktrees.length === 0) {
    console.log(chalk.yellow('No feature worktrees found'));
    return;
  }
  
  if (!currentBranch.includes(mainBranch)) {
    console.error(chalk.red(`Error: You must be on the ${mainBranch} branch to merge features`));
    console.log(chalk.dim(`Current branch: ${currentBranch}`));
    process.exit(1);
  }
  
  console.log(chalk.cyan(`Found ${featureWorktrees.length} feature worktree(s)`));
  console.log(chalk.dim('Checking for completed features...\n'));
  
  const completedFeatures: WorktreeInfo[] = [];
  
  featureWorktrees.forEach(wt => {
    const featName = wt.branch.replace('feat/', '');
    
    try {
      const aheadBehind = execSync(`git rev-list --left-right --count ${mainBranch}...${wt.branch}`, { encoding: 'utf8' }).trim();
      const [behind, ahead] = aheadBehind.split('\t').map(Number);
      
      if (ahead > 0) {
        console.log(chalk.green(`✓ ${featName}: ${ahead} commit(s) ahead`));
        completedFeatures.push(wt);
      } else {
        console.log(chalk.gray(`○ ${featName}: no new commits`));
      }
    } catch (error) {
      console.log(chalk.red(`✗ ${featName}: error checking status`));
    }
  });
  
  if (completedFeatures.length === 0) {
    console.log(chalk.yellow('\nNo features ready to merge'));
    return;
  }
  
  console.log(chalk.cyan(`\nMerging ${completedFeatures.length} feature(s) into ${mainBranch}...`));
  
  completedFeatures.forEach(wt => {
    const featName = wt.branch.replace('feat/', '');
    
    try {
      console.log(chalk.dim(`\nMerging ${wt.branch}...`));
      execSync(`git merge ${wt.branch} --no-ff -m "feat: merge ${featName}"`, { stdio: 'inherit' });
      console.log(chalk.green(`✓ Merged ${featName}`));
      
      console.log(chalk.dim(`Archiving worktree...`));
      execSync(`git worktree remove "${wt.path}"`, { stdio: 'inherit' });
      console.log(chalk.green(`✓ Archived worktree at ${wt.path}`));
      
      console.log(chalk.dim(`Deleting branch...`));
      execSync(`git branch -d ${wt.branch}`, { stdio: 'inherit' });
      console.log(chalk.green(`✓ Deleted branch ${wt.branch}`));
      
    } catch (error) {
      console.error(chalk.red(`✗ Error processing ${featName}: ${error instanceof Error ? error.message : String(error)}`));
    }
  });
  
  console.log(chalk.green(`\n✓ Feature merge completed`));
  console.log(chalk.dim(`You may want to push the changes: git push origin ${mainBranch}`));
}

export function featCommand() {
  const program = new Command('feat');
  
  program
    .description('Manage feature development with git worktrees')
    .addHelpText('after', `
Examples:
  $ ccm feat add payment-api              Create worktree in .feats/payment-api
  $ ccm feat add test --parent            Create worktree in ../project-test  
  $ ccm feat add fix --path ~/work/fix    Create worktree at custom path
  $ ccm feat list                         List active worktrees
  $ ccm feat list -a                      List all worktrees
  $ ccm feat merge                        Merge completed features

Note: By default, worktrees are created in .feats directory inside the project.
Use --parent to create in parent directory (Claude docs style), or --path for custom location.
    `);
  
  program
    .command('add <name>')
    .description('Create a new feature worktree and open in Claude Code')
    .option('--path <path>', 'Custom path for the worktree')
    .option('--parent', 'Create worktree in parent directory (Claude docs style)')
    .action(featAddCommand);
  
  program
    .command('list')
    .description('List worktrees interactively (default: active only)')
    .option('-a, --all', 'Show all worktrees including inactive')
    .option('-s, --simple', 'Show simple non-interactive list')
    .action(featListCommand);
  
  program
    .command('merge')
    .description('Merge completed features and archive worktrees')
    .action(featMergeCommand);
  
  return program;
}