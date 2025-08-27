# Claude Code Manager PR 文档

<!-- metadata for LLM updates
version: 2.10.0
last_updated: 2025-08-27
main_feature: dashboard-server-api
-->

## 🎯 核心信息

**产品名称**: Claude Code Manager (ccm)  
**最新版本**: v2.10.0  
**核心功能**: 增强 Claude Code 开发体验的集成工具  
**GitHub**: https://github.com/markshawn2020/claude-code-manager

## 🚀 最新更新：Dashboard 服务器模式 + API

```bash
npm i -g claude-code-manager
ccm dashboard            # 默认启动服务器模式
ccm dashboard --port 8080    # 自定义端口
ccm dashboard --api      # API-only 模式
```

### 核心升级
- **服务器模式默认开启**: `ccm dashboard` 现在默认启动服务器（端口 3000）
- **REST API 接口**: 提供完整的数据访问 API
- **原版界面回归**: 恢复广受好评的 bento 风格界面
- **实时数据更新**: 动态生成最新数据，非静态文件

### API 端点
- `/api/executions` - 执行历史查询
- `/api/stats` - 聚合统计数据
- `/api/sessions` - 会话信息
- `/api/projects` - 项目列表
- `/api/dashboard` - 完整仪表板数据

---

## 📑 分平台发布文档

根据不同平台的特点，我们准备了专门的发布文档：

### 社交媒体
- 📱 [微信朋友圈](docs/pr/wechat-moments.md) - 精简版本，快速传播
- 📰 [微信公众号](docs/pr/wechat-article.md) - 详细介绍，完整功能说明
- 🐦 [Twitter/X](docs/pr/twitter.md) - 280字符限制的国际化版本

### 产品发布
- 🌍 [Product Hunt](docs/pr/producthunt.md) - 英文完整版，面向国际用户

---

## 📅 版本历史

- **v2.10.0** (08-27): Dashboard 服务器模式 + REST API，恢复原版精美界面
- **v2.9.0** (08-27): 多状态栏支持，可自由切换风格
- **v2.6.0** (08-26): 全新 dashboard，集成项目分析
- **v2.4.0** (08-20): 支持 worktree 开发
- **v1.4.0** (07-13): 增强分析与导出功能
- **v1.2.0** (07-07): 集成 ccusage 费用分析
- **v1.0.0** (06-27): 项目初始发布

---

## 📝 LLM 更新指南

更新本文档时，请：
1. 修改 metadata 中的版本信息
2. 更新核心信息部分
3. 同步更新 `docs/pr/` 目录下对应平台的文档
4. 保持各平台文档风格一致性

感谢社群成员 radonx、追逐清风 对项目的贡献！