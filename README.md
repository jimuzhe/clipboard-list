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

# 安装依赖
npm install

# 编译 TypeScript
npm run build

# 启动开发模式
npm run dev

# 监听文件变化（开发时）
npm run watch
```

### 生产构建
```bash
# 构建应用
npm run dist
```

## 📁 项目结构

```
clipboard-list/
├── src/                    # 主进程源码
│   ├── main.ts            # 主进程入口
│   └── preload.ts         # 预加载脚本
├── renderer/              # 渲染进程
│   ├── index.html         # 主界面
│   ├── styles.css         # 样式文件
│   └── renderer.js        # 渲染进程逻辑
├── assets/                # 静态资源
│   └── icon.png          # 应用图标
├── dist/                  # 编译输出
├── package.json           # 项目配置
├── tsconfig.json          # TypeScript 配置
└── README.md             # 项目文档
```

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
