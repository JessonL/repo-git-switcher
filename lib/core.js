const fs = require('fs-extra');
const chalk = require('chalk');
const ora = require('ora');
const { execSync } = require('child_process');
const { findGitRepos, runGitCommand, formatOutput } = require('./utils');

class MonoSwitchCore {
  constructor() {
    this.stats = {
      total: 0,
      success: 0,
      failed: 0,
      skipped: 0
    };
  }

  /**
   * 安全切换分支 - 不影响远端
   */
  async switchBranches(options) {
    const { branch, directory, create, pull, force, match } = options;
    
    console.log(chalk.blue('@lee/mono-switchForGit'));
    console.log(chalk.green('安全切换分支:'), chalk.cyan(branch), chalk.gray('(不影响远端)'));
    console.log(chalk.green('目标目录:'), chalk.cyan(directory));
    
    if (create) console.log(chalk.yellow('模式:'), '创建本地分支');
    if (pull) console.log(chalk.yellow('模式:'), '只读拉取操作');
    if (force) console.log(chalk.yellow('模式:'), '强制切换(仅本地)');
    if (match) console.log(chalk.yellow('过滤模式:'), chalk.cyan(match));
    console.log('─'.repeat(50));

    const repos = await findGitRepos(directory, match);
    this.stats.total = repos.length;

    if (repos.length === 0) {
      console.log(chalk.yellow('未找到Git仓库'));
      return;
    }

    const spinner = ora(`正在处理 ${repos.length} 个仓库...`).start();

    for (const [index, repo] of repos.entries()) {
      spinner.text = `[${index + 1}/${repos.length}] 处理 ${repo.name}`;
      
      try {
        const result = await this.safeSwitchBranch(repo, branch, { create, pull, force });
        
        if (result.success) {
          this.stats.success++;
          spinner.suffixText = chalk.green('✓');
        } else {
          this.stats.failed++;
          spinner.suffixText = chalk.red('✗');
        }
      } catch (error) {
        this.stats.failed++;
        spinner.suffixText = chalk.red('✗');
      }
    }

    spinner.stop();
    this.printStats();
  }

  /**
   * 单个仓库的安全分支切换
   */
  async safeSwitchBranch(repo, branch, options) {
    const { create, pull, force } = options;
    const { path: repoPath, name: repoName } = repo;

    // 检查当前分支
    const currentBranch = await runGitCommand(repoPath, ['branch', '--show-current']);
    
    // 检查本地分支是否存在
    const branchExists = await runGitCommand(repoPath, ['show-ref', '--verify', `refs/heads/${branch}`])
      .then(() => true)
      .catch(() => false);

    if (!branchExists) {
      if (create) {
        // 创建本地分支
        console.log(chalk.blue(`[创建] ${repoName}: 创建本地分支 ${branch}`));
        await runGitCommand(repoPath, ['checkout', '-b', branch]);
      } else {
        console.log(chalk.yellow(`[跳过] ${repoName}: 本地分支 ${branch} 不存在`));
        return { success: false, reason: 'branch_not_exists' };
      }
    } else {
      // 执行切换
      if (force) {
        // 安全强制切换：只影响本地工作区
        const hasChanges = await runGitCommand(repoPath, ['diff-index', '--quiet', 'HEAD', '--'])
          .then(() => false)
          .catch(() => true);

        if (hasChanges) {
          console.log(chalk.yellow(`[强制] ${repoName}: 丢弃本地修改并切换`));
          await runGitCommand(repoPath, ['reset', '--hard']);
          await runGitCommand(repoPath, ['clean', '-fd']);
        }
      }

      console.log(chalk.green(`[切换] ${repoName}: ${currentBranch} → ${branch}`));
      await runGitCommand(repoPath, ['checkout', branch]);
    }

    // 安全拉取：只读取远端，不修改远端
    if (pull) {
      try {
        await runGitCommand(repoPath, ['pull', '--ff-only']);
        console.log(chalk.blue(`[拉取] ${repoName}: 代码更新成功`));
      } catch (error) {
        console.log(chalk.yellow(`[拉取] ${repoName}: 拉取失败或需要手动处理`));
      }
    }

    return { success: true };
  }

  /**
   * 列出仓库状态
   */
  async listReposStatus(directory, pattern) {
    console.log(chalk.blue('@lee/mono-switchForGit - 仓库状态列表'));
    console.log(chalk.green('目录:'), chalk.cyan(directory));
    if (pattern) console.log(chalk.green('过滤:'), chalk.cyan(pattern));
    console.log('─'.repeat(60));

    const repos = await findGitRepos(directory, pattern);
    
    if (repos.length === 0) {
      console.log(chalk.yellow('未找到Git仓库'));
      return;
    }

    let cleanCount = 0;
    let dirtyCount = 0;

    for (const repo of repos) {
      try {
        const currentBranch = await runGitCommand(repo.path, ['branch', '--show-current']);
        const isClean = await runGitCommand(repo.path, ['diff-index', '--quiet', 'HEAD', '--'])
          .then(() => true)
          .catch(() => false);

        const statusSymbol = isClean ? chalk.green('●') : chalk.red('✎');
        const statusText = isClean ? 'clean' : chalk.red('dirty');
        
        console.log(`${statusSymbol} ${chalk.cyan(repo.name.padEnd(30))} ${currentBranch.padEnd(20)} ${statusText}`);

        isClean ? cleanCount++ : dirtyCount++;
      } catch (error) {
        console.log(`${chalk.red('○')} ${chalk.gray(repo.name.padEnd(30))} ${chalk.red('error')}`);
      }
    }

    console.log('─'.repeat(60));
    console.log(chalk.green(`总计: ${repos.length} 个仓库 | 干净: ${cleanCount} | 有修改: ${dirtyCount}`));
  }

  /**
   * 状态概览
   */
  async getStatusOverview(directory, pattern) {
    console.log(chalk.blue('@lee/mono-switchForGit - 状态概览'));
    console.log(chalk.green('目录:'), chalk.cyan(directory));
    console.log('─'.repeat(50));

    const repos = await findGitRepos(directory, pattern);
    const branchMap = new Map();

    for (const repo of repos) {
      try {
        const currentBranch = await runGitCommand(repo.path, ['branch', '--show-current']);
        
        if (!branchMap.has(currentBranch)) {
          branchMap.set(currentBranch, []);
        }
        branchMap.get(currentBranch).push(repo.name);
      } catch (error) {
        // 忽略错误
      }
    }

    // 按分支分组显示
    for (const [branch, repoNames] of branchMap.entries()) {
      console.log(`\n${chalk.cyan(branch)} (${chalk.yellow(repoNames.length)}个仓库):`);
      console.log(`  ${repoNames.join(', ')}`);
    }

    console.log('─'.repeat(50));
    console.log(chalk.green(`分支统计: ${branchMap.size} 个不同分支`));
  }

  /**
   * 打印统计信息
   */
  printStats() {
    console.log('─'.repeat(50));
    const { total, success, failed } = this.stats;
    
    if (failed === 0) {
      console.log(chalk.green(`🎉 安全完成! 成功: ${success}/${total}`));
    } else {
      console.log(chalk.yellow(`📊 完成! 成功: ${success}/${total}, 失败: ${failed}/${total}`));
    }
    
    // 重置统计
    this.stats = { total: 0, success: 0, failed: 0, skipped: 0 };
  }
}

module.exports = {
  switchBranches: (options) => new MonoSwitchCore().switchBranches(options),
  listReposStatus: (directory, pattern) => new MonoSwitchCore().listReposStatus(directory, pattern),
  getStatusOverview: (directory, pattern) => new MonoSwitchCore().getStatusOverview(directory, pattern)
};