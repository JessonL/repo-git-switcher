const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 查找Git仓库
 */
async function findGitRepos(directory, pattern = '') {
  if (!(await fs.pathExists(directory))) {
    throw new Error(`目录不存在: ${directory}`);
  }

  const items = await fs.readdir(directory);
  const repos = [];

  for (const item of items) {
    const fullPath = path.join(directory, item);
    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      // 应用模式过滤
      if (pattern && !new RegExp(pattern).test(item)) {
        continue;
      }

      // 检查是否为Git仓库
      if (await isGitRepo(fullPath)) {
        repos.push({
          name: item,
          path: fullPath
        });
      }
    }
  }

  return repos;
}

/**
 * 检查是否为Git仓库
 */
async function isGitRepo(dirPath) {
  try {
    const gitDir = path.join(dirPath, '.git');
    return await fs.pathExists(gitDir);
  } catch {
    return false;
  }
}

/**
 * 执行Git命令
 */
async function runGitCommand(repoPath, args, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const result = execSync(`git ${args.join(' ')}`, {
        cwd: repoPath,
        encoding: 'utf8',
        stdio: options.silent ? 'pipe' : 'inherit'
      });
      resolve(result.trim());
    } catch (error) {
      reject(new Error(`Git命令失败: git ${args.join(' ')} - ${error.message}`));
    }
  });
}

/**
 * 格式化输出
 */
function formatOutput(type, message, data = null) {
  const timestamp = new Date().toLocaleTimeString();
  const prefixes = {
    info: 'ℹ',
    success: '✓',
    warning: '⚠',
    error: '✗'
  };

  const colors = {
    info: 'blue',
    success: 'green',
    warning: 'yellow',
    error: 'red'
  };

  return {
    timestamp,
    type,
    message,
    data,
    toString() {
      return `[${timestamp}] ${prefixes[type]} ${message}`;
    }
  };
}

module.exports = {
  findGitRepos,
  isGitRepo,
  runGitCommand,
  formatOutput
};