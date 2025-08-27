Claude Code Manager v2.10.1 紧急修复！🔧

修复内容：
🐛 解决 ESM 模块兼容性问题
✅ 修复 ccm init 报错 ERR_REQUIRE_ESM
🔄 降级 open 包至 v8.4.2
💯 完全兼容 CommonJS

问题描述：
v2.10.0 使用了 ESM-only 的 open v10
导致全局安装后运行报错

立即更新：
npm i -g claude-code-manager@latest
ccm init # 现在正常工作了！

感谢用户反馈！快速响应，稳定至上。

源码：github.com/markshawn2020/claude-code-manager