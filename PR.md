# Claude Code Manager PR 文档

<!-- metadata for LLM updates
version: 2.9.0
last_updated: 2025-08-27
main_feature: multi-statusline-support
-->

## 🎯 核心信息

**产品名称**: Claude Code Manager (ccm)  
**最新版本**: v2.9.0  
**核心功能**: 增强 Claude Code 开发体验的集成工具  
**GitHub**: https://github.com/markshawn2020/claude-code-manager

---

## 📱 微信朋友圈版本
<!-- 简短精炼，适合朋友圈快速阅读 -->

ccm v2.9.0 更新！多状态栏自由切换 🎨

```bash
npm i -g claude-code-manager
ccm sl init    # 一键安装
ccm sl select  # 切换风格
```

🚀 11:20:43 (today: $6.93) │ project (main) │ ⏱ 45s 💰 $0.123 📊 +156/-23

感谢 radonx、追逐清风 贡献！

---

## 📰 微信公众号版本
<!-- 详细介绍，包含背景和使用说明 -->

### Claude Code Manager v2.9.0：打造个性化开发状态栏

#### 🆕 本次更新亮点

**多状态栏支持** - 根据你的喜好自由切换不同风格的状态栏显示：

- **vibe-genius**: 全功能版，显示所有开发指标
- **vibe-genius-wind**: 随机表情版，让开发更有趣
- **minimal**: 极简版，专注核心信息

#### 💻 快速开始

```bash
# 安装/更新
npm i -g claude-code-manager 

# 初始化状态栏
ccm sl init

# 切换状态栏风格
ccm sl select <name>
```

#### 📊 效果展示

```
🚀 11:20:43 (today: $6.93) │ project (main) │ ⏱ 45s 💰 $0.123 📊 +156/-23 │ [Opus]
```

实时显示：
- 当前时间与今日费用
- 项目名称与分支
- 执行时长与当前费用
- 代码变更统计
- 使用的模型版本

#### 🎉 社区贡献

特别感谢社群成员 **radonx** 和 **追逐清风** 对状态栏功能的贡献！

#### 📅 版本历史

- **08-27 v2.9.0**: 多状态栏支持，可自由切换风格
- **08-26 v2.6.0**: 全新 dashboard，集成项目分析
- **08-20 v2.4.0**: 支持 worktree 开发（ccm feat）
- **07-13 v1.4.0**: 增强分析与导出功能
- **07-07 v1.2.0**: 集成 ccusage 费用分析工具
- **06-27 v1.0.0**: 项目初始发布，自动追踪执行记录

#### 💡 关于 CCM

Claude Code Manager 是一个增强 Claude Code 开发体验的集成工具，提供：
- 自动执行追踪
- 费用分析
- 项目统计
- 实时监控
- 状态栏美化

欢迎 star/fork/issue/pr 支持项目发展！

**GitHub**: https://github.com/markshawn2020/claude-code-manager

---

## 🌍 Product Hunt 版本
<!-- English version for international audience -->

### Claude Code Manager v2.9.0 - Supercharge Your Claude Code Experience

#### 🚀 What's New

**Multi-Statusline Support** - Customize your development environment with switchable statusline themes:

- **vibe-genius**: Full-featured statusline with all metrics
- **vibe-genius-wind**: Fun version with random emojis
- **minimal**: Clean and focused display

#### ⚡ Quick Setup

```bash
# Install globally
npm i -g claude-code-manager 

# Initialize statusline
ccm sl init

# Switch between styles
ccm sl select <theme-name>
```

#### 🎯 Key Features

**Real-time Development Metrics**
```
🚀 11:20:43 (today: $6.93) │ project (main) │ ⏱ 45s 💰 $0.123 📊 +156/-23 │ [Opus]
```

- **Time & Cost Tracking**: Monitor your daily spending and execution time
- **Project Context**: Current project and git branch at a glance
- **Code Changes**: Track additions and deletions in real-time
- **Model Awareness**: Know which Claude model you're using

#### 📊 Complete Feature Set

- **Automatic Execution Tracking**: Zero-config tool execution monitoring
- **Cost Analysis**: Detailed token usage and spending reports
- **Project Analytics**: Web-based dashboard with D3.js visualizations
- **Real-time Monitor**: htop-like interface for active tasks
- **Memory Discovery**: Manage CLAUDE.md files across projects
- **Worktree Support**: Seamless git worktree development

#### 🏗️ Built for Developers

- TypeScript-based CLI tool
- SQLite for local data storage
- Web-based analytics dashboard
- Terminal UI with blessed library
- Extensible hook system

#### 👥 Community

Special thanks to community members **radonx** and **追逐清风** for their contributions to the statusline feature!

#### 🔗 Links

- **GitHub**: https://github.com/markshawn2020/claude-code-manager
- **npm**: https://www.npmjs.com/package/claude-code-manager

---

## 🐦 Twitter/X 版本
<!-- 适合快速传播的简短版本 -->

🎉 CCM v2.9.0 is here! 

New: Multi-statusline support for Claude Code 🎨

```bash
npm i -g claude-code-manager
ccm sl init
```

Choose your style:
✨ vibe-genius: Full metrics
🎲 vibe-genius-wind: Fun emojis
📌 minimal: Clean & focused

GitHub: github.com/markshawn2020/claude-code-manager

#ClaudeCode #DevTools #CLI

---

## 📝 更新指南（供 LLM 使用）

### 更新流程

1. **版本信息更新**: 修改 metadata 中的 version 和 last_updated
2. **核心信息更新**: 更新版本号和主要功能描述
3. **各渠道内容更新**: 
   - 微信朋友圈：保持 3-5 行简短描述
   - 微信公众号：提供完整功能介绍和使用说明
   - Product Hunt：英文版本，突出产品价值
   - Twitter/X：控制在 280 字符内

### 注意事项

- 保持各渠道风格一致性
- 突出新功能亮点
- 包含具体使用示例
- 更新版本历史记录
- 确保链接正确性