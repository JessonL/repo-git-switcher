const fs = require('fs-extra');
const chalk = require('chalk');

/**
 * 验证选项参数
 */
function validateOptions(options) {
  const { branch, directory, create, pull, force, match } = options;

  // 验证分支名
  if (!branch || typeof branch !== 'string') {
    throw new Error('必须指定有效的分支名');
  }

  if (!/^[a-zA-Z0-9/\-_.]+$/.test(branch)) {
    throw new Error('分支名包含非法字符');
  }

  // 验证目录
  if (!directory || typeof directory !== 'string') {
    throw new Error('必须指定有效的目录路径');
  }

  if (!fs.pathExistsSync(directory)) {
    throw new Error(`目录不存在: ${directory}`);
  }

  // 验证模式匹配
  if (match && typeof match !== 'string') {
    throw new Error('模式匹配必须是字符串');
  }

  return {
    branch: branch.trim(),
    directory: directory.trim(),
    create: Boolean(create),
    pull: Boolean(pull),
    force: Boolean(force),
    match: match ? match.trim() : ''
  };
}

module.exports = {
  validateOptions
};