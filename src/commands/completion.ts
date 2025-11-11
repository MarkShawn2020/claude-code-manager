import { install, uninstall, parseEnv, log as tabtabLog } from 'tabtab';
import chalk from 'chalk';

export async function completionCommand(action?: string) {
  const programName = 'ccm';

  if (action === 'install') {
    try {
      await install({
        name: programName,
        completer: programName,
      });
      console.log(chalk.green('✓ Shell completion installed successfully!'));
      console.log(chalk.dim('Please restart your shell or run:'));
      console.log(chalk.cyan(`  source ~/.bashrc   # for bash`));
      console.log(chalk.cyan(`  source ~/.zshrc    # for zsh`));
    } catch (err) {
      console.error(chalk.red('Failed to install completion:'), err);
      process.exit(1);
    }
    return;
  }

  if (action === 'uninstall') {
    try {
      await uninstall({
        name: programName,
      });
      console.log(chalk.green('✓ Shell completion uninstalled successfully!'));
    } catch (err) {
      console.error(chalk.red('Failed to uninstall completion:'), err);
      process.exit(1);
    }
    return;
  }

  // Handle completion requests from shell
  const env = parseEnv(process.env);
  if (!env.complete) {
    // Not a completion request, show usage
    console.log('Shell completion for ccm');
    console.log('');
    console.log('Usage:');
    console.log('  ccm completion install    Install shell completion');
    console.log('  ccm completion uninstall  Remove shell completion');
    console.log('');
    console.log('Supported shells: bash, zsh, fish');
    return;
  }

  // Define completions based on context
  const { prev, words } = env;

  // Main commands
  const commands = [
    'stat',
    'backup',
    'slim',
    'usage',
    'track',
    'init',
    'monitor',
    'memory',
    'dashboard',
    'server',
    'feat',
    'statusline',
    'completion'
  ];

  // If we're completing the first argument (command)
  if (words === 1) {
    return tabtabLog(commands);
  }

  // Get the command being used
  const command = env.line.split(' ')[1];

  // Command-specific completions
  switch (command) {
    case 'stat':
      const statOptions = [
        '--width',
        '--sort-by',
        '--history-order',
        '--current',
        '--full-message',
        '--with-ai',
        '--output-path',
        '--output-format',
        '--analyzer'
      ];
      if (prev === '--sort-by') {
        return tabtabLog(['ascii', 'size', '+ascii', '-ascii', '+size', '-size']);
      }
      if (prev === '--history-order') {
        return tabtabLog(['reverse', 'forward']);
      }
      if (prev === '--output-format') {
        return tabtabLog(['json', 'markdown']);
      }
      return tabtabLog(statOptions);

    case 'slim':
      return tabtabLog(['--force', '--include-current']);

    case 'usage':
      if (words === 2) {
        return tabtabLog(['daily', 'monthly', 'session', 'blocks']);
      }
      return tabtabLog(['--since', '--until', '--json', '--breakdown', '--offline', '--live']);

    case 'init':
      return tabtabLog(['--force', '--check']);

    case 'monitor':
      if (prev === '--display-mode') {
        return tabtabLog(['tree', 'flat', 'list']);
      }
      if (prev === '--order') {
        return tabtabLog(['modified', 'priority', 'status', 'ascii']);
      }
      if (prev === '--filter') {
        return tabtabLog(['all', 'pending', 'in_progress', 'completed', 'active']);
      }
      return tabtabLog([
        '--display-mode',
        '--order',
        '--filter',
        '--project',
        '--reverse',
        '--refresh-interval'
      ]);

    case 'memory':
      return tabtabLog(['--paths-only', '--full', '--exclude']);

    case 'dashboard':
      if (prev === '--format') {
        return tabtabLog(['json', 'csv']);
      }
      return tabtabLog([
        '--port',
        '--no-server',
        '--api',
        '--no-open',
        '--export',
        '--format',
        '--refresh',
        '--skip-usage',
        '--hot-reload'
      ]);

    case 'server':
      return tabtabLog(['--port', '--api', '--no-open']);

    case 'completion':
      return tabtabLog(['install', 'uninstall']);

    case 'feat':
      if (words === 2) {
        return tabtabLog(['list', 'add', 'merge', 'clean', 'switch']);
      }
      return tabtabLog([]);

    case 'statusline':
      if (words === 2) {
        return tabtabLog(['list', 'select', 'init', 'enable', 'disable', 'test', 'status', 'config']);
      }
      // For select command, show available statusline names
      if (env.line.includes('select') && words === 3) {
        return tabtabLog(['ccstatusline', 'example-custom', 'minimal', 'vibe-genius-wind', 'vibe-genius']);
      }
      return tabtabLog([]);

    default:
      return tabtabLog([]);
  }
}
