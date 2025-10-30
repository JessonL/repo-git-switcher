# @lee/repo-git-switcher

安全的多仓库Git分支切换工具 - 不影响远端

## 功能特性

- 🔒 **安全第一**: 所有操作仅限于本地，不会创建或推送远端分支
- 🚀 **批量操作**: 一键切换多个Git仓库的分支
- 🎯 **智能过滤**: 支持模式匹配，只处理指定项目
- 📊 **状态监控**: 实时显示操作进度和结果统计
- 🔧 **多种模式**: 支持创建分支、强制切换、拉取更新等

## 安装

```bash
npm install -g @lee/repo-git-switcher
```

或本地安装：

```bash
npm install @lee/repo-git-switcher
```

## 使用方法

### 基本命令

```bash
# 显示帮助信息
git-up --help

# 显示版本号
git-up --version
```

### 切换分支

```bash
# 切换到develop分支
git-up switch develop

# 切换到新分支，不存在则创建
git-up sw feature/new-feature -c

# 切换到main分支并拉取代码
git-up switch main -p

# 强制切换到hotfix分支（丢弃本地修改）
git-up switch hotfix -f

# 只处理匹配service-*的项目
git-up switch develop -m "service-*"

# 指定自定义目录
git-up switch develop -d "./my-packages"
```

### 查看状态

```bash
# 列出所有仓库状态
git-up list

# 列出匹配模式的项目状态
git-up ls -m "service-*"

# 显示分支状态概览
git-up status
```

## 选项说明

### 切换分支选项

- `-d, --directory <dir>`: 指定包含Git仓库的目录（默认: `./packages`）
- `-c, --create`: 如果分支不存在则创建（仅本地）
- `-p, --pull`: 切换后拉取最新代码（只读操作）
- `-f, --force`: 强制切换（丢弃本地修改，不影响远端）
- `-m, --match <pattern>`: 只处理匹配指定模式的项目目录
- `--no-color`: 禁用颜色输出

### 列表/状态选项

- `-d, --directory <dir>`: 指定包含Git仓库的目录（默认: `./packages`）
- `-m, --match <pattern>`: 只处理匹配指定模式的项目目录
- `--no-color`: 禁用颜色输出

## 安全原则

✅ **不会创建或推送远端分支**  
✅ **不会向远端提交任何内容**  
✅ **所有操作仅限于本地**  
✅ **强制切换仅影响本地工作区**  
✅ **拉取操作为只读模式**

## 项目结构

```
switch-cli/
├── bin/
│   └── msg.js              # CLI入口文件 (git-up命令)
├── lib/
│   ├── cli.js              # 命令行界面
│   ├── core.js             # 核心业务逻辑
│   ├── utils.js            # 工具函数
│   └── validator.js        # 参数验证
├── package.json
└── README.md
```

## 技术栈

- **Commander**: 命令行界面框架
- **Chalk**: 终端颜色输出
- **Inquirer**: 交互式命令行界面
- **fs-extra**: 增强的文件系统操作
- **Ora**: 终端加载动画

## 开发

```bash
# 安装依赖
npm install

# 运行CLI
git-up --help
```

## 许可证

MIT License

## 作者

Lee
