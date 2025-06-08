<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# ClipBoard List - Electron 桌面应用程序

这是一个基于 Electron 的 Windows 桌面应用程序，具有以下功能：

## 核心功能
- 🚀 开机自启动 - 开机后自动启动，隐藏在系统托盘
- 📌 屏幕吸附 - 页面细长，像QQ那样，支持靠窗吸附，跟随鼠标划入划出
- ✅ 待办清单 - 支持优先级、拖拽排序、状态筛选、🍅支持番茄时钟
- 💻 剪切板管理 - 支持识别代码片段，对剪切板内容进行修改和一键复制，以及置顶
- 📝 Markdown笔记 - 实时预览、语法支持
- 🎨 现代UI - 毛玻璃效果、可切换主题
- 💾 数据持久化 - 本地文件存储，数据安全

## 技术栈
- **主进程**: TypeScript + Electron
- **渲染进程**: HTML + CSS + JavaScript
- **样式**: CSS3 with 毛玻璃效果和现代UI设计
- **数据存储**: 本地JSON文件

## 项目结构
- `src/` - TypeScript 源代码（主进程）
- `renderer/` - 渲染进程代码（HTML/CSS/JS）
- `assets/` - 静态资源文件
- `dist/` - 编译后的文件

## 开发指南
- 使用 TypeScript 进行主进程开发
- 遵循 Electron 安全最佳实践
- 注重用户体验和性能优化
- 支持热重载开发模式

## 代码规范
- 使用 ES6+ 语法
- 注重代码可读性和可维护性
- 添加适当的错误处理
- 使用 async/await 处理异步操作
