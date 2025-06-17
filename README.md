# 移记 QuiverNote - 智能剪切板管理工具

[![Version](https://img.shields.io/badge/version-2.4.0-blue.svg)](https://github.com/longdz/quiver-note)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)](https://github.com/longdz/quiver-note)
[![Electron](https://img.shields.io/badge/Electron-36.4.0-47848F.svg)](https://electronjs.org/)
[![Vibe Coding](https://img.shields.io/badge/🎵-Vibe%20Coding-ff69b4.svg)](https://github.com/longdz/quiver-note)

一个功能丰富的 Windows 桌面应用程序，基于 Electron 开发，提供剪切板管理、待办清单、Markdown 笔记等多种生产力工具。

> 🎵 **Vibe Coding Project** - 这是一个在轻松愉快的氛围中编写的项目，注重开发体验和代码美感，追求简洁优雅的实现方式。

## 🖼️ 应用预览

> 📸 应用界面预览图片将在后续版本中添加

**主要界面包括:**
- 🎨 现代化的毛玻璃风格界面
- 📱 响应式布局，支持窗口缩放
- 🌓 深色/浅色主题切换
- 📌 屏幕边缘吸附效果

## ✨ 主要功能

### 🚀 开机自启动
- 开机后自动启动
- 启动时隐藏在系统托盘
- 支持全局快捷键 `Ctrl + Shift + V` 显示/隐藏窗口

### 📌 屏幕吸附
- 窗口支持屏幕边缘自动吸附
- 类似 QQ 的悬浮窗体验
- 鼠标划入划出自动显示/隐藏功能

### 💻 智能剪切板管理
- 📋 自动监控剪切板变化
- 🔍 智能识别内容类型（代码、URL、邮箱、图片路径等）
- 📌 支持内容置顶功能
- ✏️ 可编辑剪切板历史内容
- 🔄 一键复制到剪切板
- 🗑️ 支持删除和清空操作
- 🔍 搜索功能

### ✅ 待办清单
- ➕ 添加、编辑、删除待办事项
- 🏷️ 三级优先级（高、中、低）
- 📝 支持描述信息
- ✔️ 完成状态管理
- 🔄 拖拽排序
- 🔍 状态筛选（全部、待完成、已完成、高优先级）
- 🍅 集成番茄时钟功能

### 🍅 番茄时钟
- ⏰ 可自定义工作和休息时间
- ⏯️ 开始、暂停、重置控制
- 🔔 到时提醒通知
- 📊 自动切换工作/休息模式

### 📝 Markdown 笔记
- ✍️ 实时 Markdown 编辑
- 👁️ 实时预览功能
- 📱 分屏模式（编辑+预览）
- 💾 自动保存功能
- 🔍 笔记搜索
- 📂 笔记列表管理

### 🎨 现代化 UI
- 🌈 支持浅色/深色主题切换
- ✨ 毛玻璃效果
- 🎯 响应式设计
- 🖱️ 流畅的动画效果
- 📱 移动端友好

### 💾 数据持久化
- 💿 本地文件存储
- 🔒 数据安全保护
- ⚙️ 设置同步保存
- 📤 支持数据导入导出

## 🛠️ 技术栈

- **框架**: Electron 36.4.0
- **语言**: TypeScript 5.8.3 + JavaScript
- **前端**: HTML5 + CSS3
- **样式**: 原生 CSS（毛玻璃效果、CSS Grid/Flexbox）
- **图标**: Emoji + Unicode
- **存储**: 本地 JSON 文件
- **构建工具**: electron-builder 24.6.4
- **依赖管理**: 
  - auto-launch 5.0.6 (开机自启)
  - electron-updater 6.6.2 (自动更新)

### 🎵 开发理念 (Vibe Coding)

这个项目遵循 **Vibe Coding** 的开发理念：

- **🎨 美感优先**: 代码结构清晰，注重可读性和优雅性
- **🌟 体验驱动**: 专注用户体验，追求流畅的交互效果
- **⚡ 渐进增强**: 从核心功能开始，逐步完善特性
- **🎭 趣味开发**: 保持开发过程的乐趣，避免过度工程化
- **🌈 现代审美**: 使用现代UI设计语言，毛玻璃效果等潮流元素

## 📦 安装和运行

### 💾 预编译版本下载

推荐直接下载已编译好的安装包：

1. 访问 [Releases](https://github.com/longdz/quiver-note/releases) 页面
2. 下载最新版本的 `移记 Setup 2.4.0.exe`
3. 双击安装包，按照向导完成安装
4. 安装完成后会自动启动应用

> **📋 系统要求**: Windows 10/11 (64位)

### 环境要求
- Node.js 16.0+
- npm 或 yarn

### 开发环境
```bash
# 克隆项目
git clone https://github.com/longdz/quiver-note.git
cd quiver-note

# 安装依赖 (首次运行会下载约470MB的依赖包)
npm install

# 编译 TypeScript
npm run build

# 启动开发模式
npm run dev

# 监听文件变化（开发时）
npm run watch
```

> **💡 提示**: 项目使用 `.gitignore` 忽略了大文件目录，克隆后需要运行 `npm install` 安装依赖包。

### 生产构建
```bash
# 构建 Windows 安装包
npm run dist

# 清理构建文件
npm run clean
```

### 🎯 可用脚本

- `npm run build` - 编译 TypeScript 代码
- `npm run start` - 构建并启动应用
- `npm run dev` - 开发模式启动（支持热重载）
- `npm run watch` - 监听文件变化自动编译
- `npm run dist` - 构建 Windows 安装包
- `npm run clean` - 清理构建文件

## 📁 项目结构

```
quiver-note/
├── src/                          # 主进程源码 (TypeScript)
│   ├── main.ts                  # 主进程入口文件
│   ├── preload.ts               # 预加载脚本
│   ├── managers/                # 管理器模块
│   │   ├── AutoStartManager.ts  # 自启动管理
│   │   ├── ClipboardManager.ts  # 剪切板管理 (多版本实现)
│   │   ├── DataManager.ts       # 数据管理
│   │   ├── ShortcutManager.ts   # 快捷键管理
│   │   ├── TrayManager.ts       # 系统托盘管理
│   │   └── WindowManager.ts     # 窗口管理
│   ├── services/                # 服务层
│   │   ├── DataService.ts       # 数据服务
│   │   ├── IPCService.ts        # 进程间通信服务
│   │   └── UpdateService.ts     # 自动更新服务
│   ├── types/                   # TypeScript 类型定义
│   │   ├── clipboard.ts         # 剪切板类型
│   │   ├── notes.ts             # 笔记类型
│   │   ├── todo.ts              # 待办事项类型
│   │   └── index.ts             # 通用类型
│   └── utils/                   # 工具函数
│       ├── Config.ts            # 配置管理
│       └── Logger.ts            # 日志管理
├── renderer/                    # 渲染进程 (前端)
│   ├── index.html              # 主界面 HTML
│   ├── main.js                 # 渲染进程主逻辑
│   ├── scripts/                # JavaScript 模块
│   │   ├── components/         # UI 组件
│   │   ├── effects/            # 特效组件
│   │   ├── managers/           # 前端管理器
│   │   ├── services/           # 前端服务
│   │   └── utils/              # 前端工具函数
│   └── styles/                 # 样式模块
│       ├── animations.css      # 动画样式
│       ├── base.css            # 基础样式
│       ├── clipboard.css       # 剪切板样式
│       ├── components.css      # 组件样式
│       ├── layout.css          # 布局样式
│       ├── liquid-glass-theme.css # 毛玻璃主题
│       ├── modal.css           # 模态框样式
│       ├── notes.css           # 笔记样式
│       ├── pomodoro.css        # 番茄时钟样式
│       ├── todo.css            # 待办事项样式
│       └── ...                 # 其他样式文件
├── assets/                     # 静态资源
│   ├── app-icon.ico           # 应用图标 (Windows)
│   ├── app-icon.png           # 应用图标 (PNG)
│   ├── tray-icon.ico          # 托盘图标 (Windows)
│   └── tray-icon.png          # 托盘图标 (PNG)
├── deploy/                    # 部署版本 (可选)
├── dist/                      # TypeScript 编译输出 (.gitignore)
├── dist-installer/            # 构建输出目录 (.gitignore)
├── node_modules/              # 依赖包 (.gitignore)
├── package.json               # 项目配置和依赖
├── tsconfig.json              # TypeScript 配置
├── update-info.json           # 更新信息配置
├── .gitignore                 # Git 忽略文件
└── README.md                  # 项目文档
```

### 📦 文件大小优化

为了减少 Git 仓库大小，以下文件/目录已被 `.gitignore` 忽略：

- **node_modules/** (~470MB) - NPM 依赖包，可通过 `npm install` 重新安装
- **dist-installer/** (~374MB) - 构建输出的安装包和可执行文件
- **dist/** - TypeScript 编译输出，可通过 `npm run build` 重新生成
- 各种日志、临时文件、IDE 配置文件等

实际需要上传的源码文件大小约 **2-5MB**，主要包含：
- 源码文件 (src/, renderer/)
- 配置文件 (package.json, tsconfig.json)
- 资源文件 (assets/)
- 文档文件 (README.md, *.md)

## ⚡ 快捷键

- `Ctrl + Shift + V` - 显示/隐藏主窗口
- `Esc` - 隐藏窗口
- `Ctrl + ,` - 打开设置面板

## 🔧 配置选项

### 外观设置
- 主题选择（浅色/深色/跟随系统）
- 毛玻璃效果开关
- 窗口透明度调节

### 功能设置
- 开机自启动
- 剪切板监控
- 最大历史记录数量
- 通知设置

### 快捷键设置
- 自定义全局快捷键
- 窗口操作快捷键

## 📋 版本历史

### v2.4.0 (当前版本)
- ✨ 优化用户界面和体验
- 🔧 改进剪切板管理功能
- 🛠️ 代码重构和性能优化
- 📦 更新依赖包到最新版本

### 历史版本
- v2.3.1 - 修复已知问题
- v2.3.0 - 新增功能模块
- v2.0.0 - 主要版本更新
- v1.0.0 - 初始版本发布

## 📋 开发计划

### Phase 1: 基础功能 ✅
- [x] 项目框架搭建
- [x] 基础UI界面
- [x] 剪切板监控
- [x] 系统托盘集成
- [x] 屏幕吸附功能
- [x] 开机自启动
- [x] 快捷键管理

### Phase 2: 核心功能 ✅
- [x] 待办清单完整实现
- [x] 番茄时钟功能
- [x] Markdown 笔记系统
- [x] 数据持久化
- [x] 自动更新服务

### Phase 3: 增强功能 �
- [ ] 云同步功能
- [ ] 插件系统
- [ ] 自定义主题
- [ ] 快捷键自定义
- [ ] 多语言支持
- [ ] 社区功能模块

### Phase 4: 优化完善 📋
- [ ] 性能优化
- [ ] 内存使用优化
- [ ] 更完善的错误处理
- [ ] 用户体验优化

## ❓ 常见问题 (FAQ)

### Q: 应用启动后在哪里？
A: 应用启动后会自动隐藏到系统托盘，在任务栏右下角可以看到托盘图标。使用快捷键 `Ctrl + Shift + V` 可以显示/隐藏主窗口。

### Q: 如何关闭应用？
A: 右键点击系统托盘图标，选择"退出"即可完全关闭应用。

### Q: 剪切板内容没有被监控到？
A: 请确保在设置中开启了"剪切板监控"功能，并且应用有足够的系统权限。

### Q: 如何设置开机自启动？
A: 在设置面板中可以找到"开机自启动"选项，勾选即可。

### Q: 应用占用内存太高？
A: 可以在设置中减少"最大历史记录数量"来降低内存占用。

## 🤝 贡献指南

我们欢迎所有形式的贡献！请按照以下步骤：

1. **Fork** 项目到你的账户
2. **创建** 功能分支 (`git checkout -b feature/AmazingFeature`)
3. **提交** 更改 (`git commit -m 'Add some AmazingFeature'`)
4. **推送** 到分支 (`git push origin feature/AmazingFeature`)
5. **打开** Pull Request

### 🎵 Vibe Coding 贡献原则

在贡献代码时，请遵循我们的 **Vibe Coding** 理念：

- **💫 保持简洁**: 优先选择简单直观的解决方案
- **🎨 注重美感**: 代码要有良好的格式和结构
- **😊 快乐编程**: 享受编程过程，写出让人愉悦的代码
- **🌈 用户至上**: 始终考虑用户体验和使用场景
- **🔄 持续改进**: 小步快跑，持续优化和迭代

### 贡献类型
- 🐛 Bug 修复
- ✨ 新功能开发
- 📚 文档改进
- 🎨 UI/UX 改进
- ⚡ 性能优化

## 📄 许可证

本项目采用 **MIT 许可证** 开源。

### MIT 许可证要点：
- ✅ **商业使用** - 可以用于商业项目
- ✅ **修改** - 可以修改源代码
- ✅ **分发** - 可以分发原始代码或修改后的代码
- ✅ **私有使用** - 可以私人使用
- ✅ **许可证包含** - 分发时需要包含许可证和版权声明

### 免责声明：
- ❌ **责任** - 作者不承担任何责任
- ❌ **保证** - 软件按"原样"提供，不提供任何保证

查看完整的许可证文本：[LICENSE](LICENSE) 文件

## 📞 联系方式

- 作者: LongDz
- 项目链接: [https://github.com/longdz/quiver-note](https://github.com/longdz/quiver-note)
- 问题反馈: [Issues](https://github.com/longdz/quiver-note/issues)

## 🙏 致谢

- [Electron](https://electronjs.org/) - 跨平台桌面应用框架
- [TypeScript](https://www.typescriptlang.org/) - JavaScript 的超集
- [electron-builder](https://www.electron.build/) - 应用打包工具
- [auto-launch](https://github.com/Teamwork/node-auto-launch) - 开机自启动功能
- 所有贡献者和用户的支持

## 📜 更新日志

详细的更新日志请查看 [CHANGELOG.md](CHANGELOG.md) 文件。

---

⭐ 如果这个项目对你有帮助，请给它一个星标！

🐛 发现问题？欢迎提交 [Issue](https://github.com/longdz/quiver-note/issues)

🚀 想要贡献代码？欢迎提交 [Pull Request](https://github.com/longdz/quiver-note/pulls)
