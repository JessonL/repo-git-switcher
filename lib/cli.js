const { program } = require('commander');
const chalk = require('chalk');
const { switchBranches, listReposStatus } = require('./core');
const { validateOptions } = require('./validator');

class MonoSwitchCLI {
  constructor() {
    this.setupProgram();
  }

  setupProgram() {
    program
      .name('git-up')
      .description(chalk.blue('@lee_0527/repo-git-switcher - 安全的多仓库Git分支切换工具'))
      .version('1.0.0', '-v, --version', '显示版本号');

    // 切换分支命令
    program
      .command('switch <branch>')
      .alias('sw')
      .description('切换到指定分支')
      .option('-d, --directory <dir>', '指定包含Git仓库的目录', './packages')
      .option('-c, --create', '如果分支不存在则创建（仅本地）')
      .option('-p, --pull', '切换后拉取最新代码（只读操作）')
      .option('-f, --force', '强制切换（丢弃本地修改，不影响远端）')
      .option('-m, --match <pattern>', '只处理匹配指定模式的项目目录')
      .option('-s, --search <pattern>', '如果没有精确匹配，只显示包含搜索模式的分支')
      .option('--no-color', '禁用颜色输出')
      .action(this.handleSwitch.bind(this));

    // 搜索分支命令
    program
      .command('search <pattern>')
      .alias('s')
      .description('搜索匹配指定模式的分支')
      .option('-d, --directory <dir>', '指定包含Git仓库的目录', './packages')
      .option('-m, --match <pattern>', '只处理匹配指定模式的项目目录')
      .option('--no-color', '禁用颜色输出')
      .action(this.handleSearch.bind(this));

    // 列表命令
    program
      .command('list')
      .alias('ls')
      .description('列出所有仓库的当前分支状态')
      .option('-d, --directory <dir>', '指定包含Git仓库的目录', './packages')
      .option('-m, --match <pattern>', '只处理匹配指定模式的项目目录')
      .option('--no-color', '禁用颜色输出')
      .action(this.handleList.bind(this));

    // 状态命令
    program
      .command('status')
      .alias('st')
      .description('显示仓库状态概览')
      .option('-d, --directory <dir>', '指定包含Git仓库的目录', './packages')
      .option('-m, --match <pattern>', '只处理匹配指定模式的项目目录')
      .action(this.handleStatus.bind(this));

    // 帮助信息
    program.addHelpText('after', `
${chalk.yellow('安全原则:')}
  ${chalk.green('✓')} 不会创建或推送远端分支
  ${chalk.green('✓')} 不会向远端提交任何内容  
  ${chalk.green('✓')} 所有操作仅限于本地

${chalk.yellow('示例:')}
  ${chalk.cyan('git-up switch develop')}                    # 切换到develop分支
  ${chalk.cyan('git-up sw feature/new-feature -c')}         # 切换到新分支，不存在则创建
  ${chalk.cyan('git-up switch main -p')}                    # 切换到main分支并拉取代码
  ${chalk.cyan('git-up switch hotfix -f')}                  # 强制切换到hotfix分支
  ${chalk.cyan('git-up switch 9.5.0 -s dev')}               # 切换到9.5.0，不存在则只显示包含"dev"的分支
  ${chalk.cyan('git-up search dev')}                        # 搜索包含"dev"的分支
  ${chalk.cyan('git-up s feature -m "service-*"')}          # 在service项目中搜索包含"feature"的分支
  ${chalk.cyan('git-up list')}                              # 列出所有仓库状态
  ${chalk.cyan('git-up ls -m "service-*"')}                 # 列出匹配service-*的项目
  ${chalk.cyan('git-up status')}                            # 显示状态概览
    `);
  }

  async handleSwitch(branch, options) {
    try {
      // 验证选项（异步）
      const validatedOptions = await validateOptions({
        branch,
        directory: options.directory,
        create: options.create,
        pull: options.pull,
        force: options.force,
        match: options.match,
        search: options.search
      });

      // 执行分支切换
      await switchBranches(validatedOptions);
    } catch (error) {
      console.error(chalk.red('错误:'), error.message);
      process.exit(1);
    }
  }

  async handleList(options) {
    try {
      await listReposStatus(options.directory, options.match);
    } catch (error) {
      console.error(chalk.red('错误:'), error.message);
      process.exit(1);
    }
  }

  async handleStatus(options) {
    try {
      const { getStatusOverview } = require('./core');
      await getStatusOverview(options.directory, options.match);
    } catch (error) {
      console.error(chalk.red('错误:'), error.message);
      process.exit(1);
    }
  }

  async handleSearch(pattern, options) {
    try {
      const { searchBranches } = require('./core');
      await searchBranches(pattern, options.directory, options.match);
    } catch (error) {
      console.error(chalk.red('错误:'), error.message);
      process.exit(1);
    }
  }

  run() {
    program.parse(process.argv);
  }
}

module.exports = new MonoSwitchCLI();
