const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');

/**
 * 验证模式安全性
 */
function validatePattern(pattern) {
  if (pattern.length > 100) {
    throw new Error('模式长度不能超过100个字符');
  }
  // 限制复杂正则表达式，防止ReDoS攻击
  if (/[\\^$.*+?()[\]{}|]/.test(pattern)) {
    throw new Error('模式包含不安全的特殊字符，请使用简单通配符模式');
  }
  return pattern;
}

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
      // 应用模式过滤（安全版本）
      if (pattern) {
        const safePattern = validatePattern(pattern);
        // 使用简单的字符串匹配而不是正则表达式
        if (!item.includes(safePattern)) {
          continue;
        }
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
 * 执行Git命令（安全版本）
 */
async function runGitCommand(repoPath, args, options = {}) {
  return new Promise((resolve, reject) => {
    const gitProcess = spawn('git', args, {
      cwd: repoPath,
      stdio: options.silent ? 'pipe' : 'inherit'
    });

    let stdout = '';
    let stderr = '';

    gitProcess.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    gitProcess.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    gitProcess.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`Git命令失败: git ${args.join(' ')} - ${stderr || '未知错误'}`));
      }
    });

    gitProcess.on('error', (error) => {
      reject(new Error(`Git进程启动失败: ${error.message}`));
    });
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
