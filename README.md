# ClipBoard List - 智能剪切板管理工具

一个功能丰富的 Windows 桌面应用程序，基于 Electron 开发，提供剪切板管理、待办清单、Markdown 笔记等多种生产力工具。

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

- **框架**: Electron
- **语言**: TypeScript + JavaScript
- **前端**: HTML5 + CSS3
- **样式**: 原生 CSS（毛玻璃效果、CSS Grid/Flexbox）
- **图标**: Emoji + Unicode
- **存储**: 本地 JSON 文件

## 📦 安装和运行

### 环境要求
- Node.js 16.0+
- npm 或 yarn

### 开发环境
```bash
# 克隆项目
git clone https://github.com/longdz/clipboard-list.git
cd clipboard-list

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
# 构建应用
npm run dist
```

## 📁 项目结构

```
clipboard-list/
├── src/                          # 主进程源码 (TypeScript)
│   ├── main.ts                  # 主进程入口文件
│   ├── preload.ts               # 预加载脚本
│   ├── managers/                # 管理器模块
│   │   ├── AutoStartManager.ts  # 自启动管理
│   │   ├── ClipboardManager.ts  # 剪切板管理
│   │   ├── DataManager.ts       # 数据管理
│   │   ├── TrayManager.ts       # 系统托盘管理
│   │   └── WindowManager.ts     # 窗口管理
│   ├── services/                # 服务层
│   │   ├── DataService.ts       # 数据服务
│   │   └── IPCService.ts        # 进程间通信服务
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
│   ├── renderer.js             # 渲染进程主逻辑
│   ├── styles.css              # 主样式文件
│   ├── scripts/                # JavaScript 模块
│   │   ├── components/         # UI 组件
│   │   ├── managers/           # 前端管理器
│   │   ├── services/           # 前端服务
│   │   └── utils/              # 前端工具函数
│   └── styles/                 # 样式模块
├── assets/                     # 静态资源
│   ├── app-icon.ico           # 应用图标 (Windows)
│   ├── app-icon.png           # 应用图标 (PNG)
│   ├── tray-icon.ico          # 托盘图标 (Windows)
│   └── tray-icon.png          # 托盘图标 (PNG)
├── dist/                      # TypeScript 编译输出 (.gitignore)
├── dist-installer/            # 构建输出目录 (.gitignore)
├── node_modules/              # 依赖包 (.gitignore)
├── package.json               # 项目配置和依赖
├── tsconfig.json              # TypeScript 配置
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

## 📋 开发计划

### Phase 1: 基础功能 ✅
- [x] 项目框架搭建
- [x] 基础UI界面
- [x] 剪切板监控
- [x] 系统托盘集成
- [x] 屏幕吸附功能

### Phase 2: 核心功能 🚧
- [ ] 待办清单完整实现
- [ ] 番茄时钟功能
- [ ] Markdown 笔记系统
- [ ] 数据持久化

### Phase 3: 增强功能 📋
- [ ] 云同步功能
- [ ] 插件系统
- [ ] 自定义主题
- [ ] 快捷键自定义
- [ ] 多语言支持

### Phase 4: 优化完善 📋
- [ ] 性能优化
- [ ] 内存使用优化
- [ ] 自动更新功能
- [ ] 错误报告系统

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- 作者: LongDz
- 项目链接: [https://github.com/longdz/clipboard-list](https://github.com/longdz/clipboard-list)

## 🙏 致谢

- [Electron](https://electronjs.org/) - 跨平台桌面应用框架
- [TypeScript](https://www.typescriptlang.org/) - JavaScript 的超集
- 所有贡献者和用户的支持

---

⭐ 如果这个项目对你有帮助，请给它一个星标！
