# ClipBoard List - 开发文档

## 项目概述

ClipBoard List 是一个基于 Electron 的 Windows 桌面应用程序，专注于提供智能剪切板管理、待办清单、Markdown 笔记等功能。采用模块化低耦合设计，便于维护和扩展。

## 技术栈

- **主进程**: TypeScript + Electron API
- **渲染进程**: HTML5 + CSS3 + JavaScript ES6+
- **构建工具**: TypeScript Compiler
- **包管理**: npm
- **数据存储**: 本地JSON文件
- **UI框架**: 原生CSS3 + 毛玻璃效果

## 整体架构设计

### 架构图
```
┌─────────────────────────────────────────────────────────────────┐
│                        主进程 (Main Process)                     │
├─────────────────────────────────────────────────────────────────┤
│  managers/          │  services/         │  utils/              │
│  ├─WindowManager     │  ├─IPCService      │  ├─Logger            │
│  ├─TrayManager       │  ├─DataService     │  ├─Config            │
│  ├─ClipboardManager  │  ├─NotificationSvc │  ├─FileUtils         │
│  ├─AutoStartManager  │  └─UpdateService   │  └─Validator         │
│  └─ShortcutManager   │                    │                      │
└─────────────────────────────────────────────────────────────────┘
                               │ IPC │
┌─────────────────────────────────────────────────────────────────┐
│                       渲染进程 (Renderer Process)                 │
├─────────────────────────────────────────────────────────────────┤
│  managers/          │  services/         │  components/         │
│  ├─ClipboardUI      │  ├─ThemeService    │  ├─Modal             │
│  ├─TodoUI           │  ├─DataService     │  ├─Notification      │
│  ├─NotesUI          │  ├─SearchService   │  ├─DragDrop          │
│  ├─SettingsUI       │  └─APIService      │  └─ContextMenu       │
│  └─PomodoroUI       │                    │                      │
└─────────────────────────────────────────────────────────────────┘
```

### 设计原则
1. **单一职责**: 每个类只负责一个功能领域
2. **低耦合**: 模块间通过接口和事件通信
3. **高内聚**: 相关功能聚合在同一模块内
4. **依赖倒置**: 依赖抽象而非具体实现
5. **开闭原则**: 对扩展开放，对修改关闭

## 项目目录结构

```
clipboard-list/
├── src/                           # 主进程源码
│   ├── main.ts                    # 应用入口
│   ├── preload.ts                 # 预加载脚本
│   ├── managers/                  # 功能管理器
│   │   ├── WindowManager.ts       # 窗口管理
│   │   ├── TrayManager.ts         # 托盘管理
│   │   ├── ClipboardManager.ts    # 剪切板管理
│   │   ├── AutoStartManager.ts    # 自启动管理
│   │   └── ShortcutManager.ts     # 快捷键管理
│   ├── services/                  # 核心服务
│   │   ├── IPCService.ts          # IPC通信服务
│   │   ├── DataService.ts         # 数据存储服务
│   │   ├── NotificationService.ts # 通知服务
│   │   └── UpdateService.ts       # 更新服务
│   ├── utils/                     # 工具类
│   │   ├── Logger.ts              # 日志工具
│   │   ├── Config.ts              # 配置管理
│   │   ├── FileUtils.ts           # 文件工具
│   │   └── Validator.ts           # 数据验证
│   └── types/                     # 类型定义
│       ├── index.ts               # 主要类型导出
│       ├── clipboard.ts           # 剪切板相关类型
│       ├── todo.ts                # 待办事项类型
│       └── notes.ts               # 笔记相关类型
├── renderer/                      # 渲染进程
│   ├── index.html                 # 主页面
│   ├── styles/                    # 样式文件
│   │   ├── main.css               # 主样式
│   │   ├── themes.css             # 主题样式
│   │   └── components.css         # 组件样式
│   ├── scripts/                   # JavaScript模块
│   │   ├── App.js                 # 应用主控制器
│   │   ├── managers/              # UI管理器
│   │   │   ├── ClipboardUI.js     # 剪切板UI
│   │   │   ├── TodoUI.js          # 待办UI
│   │   │   ├── NotesUI.js         # 笔记UI
│   │   │   ├── SettingsUI.js      # 设置UI
│   │   │   └── PomodoroUI.js      # 番茄时钟UI
│   │   ├── services/              # 前端服务
│   │   │   ├── ThemeService.js    # 主题服务
│   │   │   ├── DataService.js     # 数据服务
│   │   │   └── SearchService.js   # 搜索服务
│   │   ├── components/            # UI组件
│   │   │   ├── Modal.js           # 模态框
│   │   │   ├── Notification.js    # 通知组件
│   │   │   ├── DragDrop.js        # 拖拽组件
│   │   │   └── ContextMenu.js     # 右键菜单
│   │   └── utils/                 # 前端工具
│   │       ├── DateUtils.js       # 日期工具
│   │       ├── TextUtils.js       # 文本工具
│   │       └── MarkdownRenderer.js # Markdown渲染
│   └── assets/                    # 静态资源
│       ├── icons/                 # 图标文件
│       └── fonts/                 # 字体文件
├── assets/                        # 全局资源
│   ├── icons/                     # 应用图标
│   └── tray/                      # 托盘图标
├── data/                          # 数据目录
│   ├── clipboard.json             # 剪切板历史
│   ├── todos.json                 # 待办事项
│   ├── notes.json                 # 笔记数据
│   └── config.json                # 应用配置
├── dist/                          # 编译输出
├── build/                         # 构建输出
├── package.json                   # 项目配置
├── tsconfig.json                  # TypeScript配置
├── .gitignore                     # Git忽略文件
└── README.md                      # 项目说明
```

## 核心功能开发指南

### 1. 🚀 开机自启动功能

#### 技术实现
- 使用 `auto-launch` 库或 Electron 原生 API
- 支持用户手动开启/关闭自启动
- 启动时自动隐藏到系统托盘

#### 代码框架
```typescript
// src/managers/AutoStartManager.ts
export class AutoStartManager {
  private autoLauncher: AutoLaunch;
  
  constructor() {
    this.autoLauncher = new AutoLaunch({
      name: 'ClipBoard List',
      path: app.getPath('exe'),
      isHidden: true
    });
  }
  
  async setAutoStart(enable: boolean): Promise<void> {
    if (enable) {
      await this.autoLauncher.enable();
    } else {
      await this.autoLauncher.disable();
    }
  }
  
  async isEnabled(): Promise<boolean> {
    return await this.autoLauncher.isEnabled();
  }
}
```

### 2. 📌 屏幕吸附功能

#### 技术实现
- 监听窗口位置变化
- 计算窗口与屏幕边缘距离
- 自动吸附到最近边缘
- 支持鼠标移入/移出显示/隐藏

#### 吸附逻辑
```typescript
// src/managers/WindowManager.ts
export class WindowManager {
  private window: BrowserWindow;
  private isDocked = false;
  private dockSide: 'left' | 'right' | 'top' = 'right';
  private readonly DOCK_THRESHOLD = 50;
  private readonly DOCK_OFFSET = 5;
  
  initDocking(): void {
    this.window.on('moved', () => this.checkDocking());
    this.window.on('mouse-enter', () => this.showWindow());
    this.window.on('mouse-leave', () => this.hideWindow());
  }
  
  private checkDocking(): void {
    const bounds = this.window.getBounds();
    const display = screen.getDisplayMatching(bounds);
    const { x, y, width, height } = display.workArea;
    
    // 检查是否接近屏幕边缘
    if (bounds.x <= x + this.DOCK_THRESHOLD) {
      this.dockToSide('left');
    } else if (bounds.x + bounds.width >= x + width - this.DOCK_THRESHOLD) {
      this.dockToSide('right');
    }
  }
  
  private dockToSide(side: 'left' | 'right' | 'top'): void {
    const display = screen.getPrimaryDisplay();
    const { x, y, width, height } = display.workArea;
    
    let newX = bounds.x;
    
    switch (side) {
      case 'left':
        newX = x - bounds.width + this.DOCK_OFFSET;
        break;
      case 'right':
        newX = x + width - this.DOCK_OFFSET;
        break;
    }
    
    this.window.setBounds({ x: newX, y: bounds.y });
    this.isDocked = true;
    this.dockSide = side;
  }
}
```

### 3. ✅ 待办清单功能

#### 功能特性
- 优先级设置（高、中、低）
- 拖拽排序
- 状态筛选（全部、未完成、已完成）
- 分类标签
- 截止日期提醒
- 🍅 番茄时钟集成

#### 数据结构
```typescript
// src/types/todo.ts
export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  category: string;
  tags: string[];
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  pomodoroCount: number;
  estimatedPomodoros: number;
}

export interface TodoCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
}
```

#### 管理器实现
```typescript
// renderer/scripts/managers/TodoUI.js
class TodoUI {
  constructor() {
    this.todos = [];
    this.categories = [];
    this.filters = {
      status: 'all',
      priority: 'all',
      category: 'all'
    };
    this.sortable = null;
    this.init();
  }
  
  init() {
    this.initDragDrop();
    this.bindEvents();
    this.loadTodos();
  }
  
  initDragDrop() {
    const container = document.getElementById('todo-list');
    this.sortable = new Sortable(container, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      onEnd: (evt) => this.handleReorder(evt)
    });
  }
  
  addTodo(todoData) {
    const todo = {
      id: this.generateId(),
      ...todoData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.todos.unshift(todo);
    this.saveTodos();
    this.renderTodos();
  }
  
  toggleTodo(id) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.status = todo.status === 'completed' ? 'pending' : 'completed';
      todo.updatedAt = new Date();
      this.saveTodos();
      this.renderTodos();
    }
  }
  
  filterTodos() {
    return this.todos.filter(todo => {
      if (this.filters.status !== 'all' && todo.status !== this.filters.status) {
        return false;
      }
      if (this.filters.priority !== 'all' && todo.priority !== this.filters.priority) {
        return false;
      }
      if (this.filters.category !== 'all' && todo.category !== this.filters.category) {
        return false;
      }
      return true;
    });
  }
}
```

### 4. 💻 剪切板管理功能

#### 功能特性
- 自动监听剪切板变化
- 智能识别内容类型（文本、图片、文件、代码）
- 代码语法识别和高亮
- 内容搜索和过滤
- 一键复制和置顶
- 历史记录管理

#### 数据结构
```typescript
// src/types/clipboard.ts
export interface ClipboardItem {
  id: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'code';
  subType?: string; // 对于代码类型，存储语言类型
  size: number;
  timestamp: Date;
  isPinned: boolean;
  tags: string[];
  preview?: string; // 长文本的预览
}

export interface ClipboardConfig {
  maxHistorySize: number;
  enableAutoSave: boolean;
  enableNotification: boolean;
  excludedApps: string[];
}
```

#### 剪切板监听器
```typescript
// src/managers/ClipboardManager.ts
export class ClipboardManager extends EventEmitter {
  private history: ClipboardItem[] = [];
  private config: ClipboardConfig;
  private monitorTimer: NodeJS.Timeout | null = null;
  private lastClipboardContent = '';
  
  constructor(config: ClipboardConfig) {
    super();
    this.config = config;
    this.loadHistory();
  }
  
  startMonitoring(): void {
    this.monitorTimer = setInterval(() => {
      this.checkClipboard();
    }, 500);
  }
  
  private checkClipboard(): void {
    const currentContent = clipboard.readText();
    
    if (currentContent && currentContent !== this.lastClipboardContent) {
      this.lastClipboardContent = currentContent;
      this.addToHistory(currentContent);
    }
  }
  
  private addToHistory(content: string): void {
    const item: ClipboardItem = {
      id: this.generateId(),
      content,
      type: this.detectContentType(content),
      subType: this.detectSubType(content),
      size: content.length,
      timestamp: new Date(),
      isPinned: false,
      tags: [],
      preview: content.length > 100 ? content.substring(0, 100) + '...' : content
    };
    
    // 避免重复
    if (!this.isDuplicate(item)) {
      this.history.unshift(item);
      
      // 限制历史记录数量
      if (this.history.length > this.config.maxHistorySize) {
        this.history = this.history.slice(0, this.config.maxHistorySize);
      }
      
      this.saveHistory();
      this.emit('clipboard-changed', item);
    }
  }
  
  private detectContentType(content: string): ClipboardItem['type'] {
    // 检测是否为文件路径
    if (/^[A-Za-z]:\\/.test(content) || /^\//.test(content)) {
      return 'file';
    }
    
    // 检测是否为代码
    if (this.isCodeContent(content)) {
      return 'code';
    }
    
    return 'text';
  }
  
  private isCodeContent(content: string): boolean {
    const codePatterns = [
      /function\s+\w+\s*\(/,           // 函数定义
      /class\s+\w+\s*{/,              // 类定义
      /import\s+.*from\s+['"`]/,      // ES6 import
      /#include\s*<.*>/,              // C/C++ include
      /def\s+\w+\s*\(/,               // Python 函数
      /<\/?[a-z][\s\S]*>/i,          // HTML 标签
      /\{\s*['"]\w+['"]:\s*['"]/,     // JSON 对象
    ];
    
    return codePatterns.some(pattern => pattern.test(content));
  }
  
  private detectSubType(content: string): string | undefined {
    if (this.detectContentType(content) !== 'code') return undefined;
    
    const languagePatterns = {
      'javascript': [/function\s+\w+/, /const\s+\w+\s*=/, /=>\s*{/, /console\.log/],
      'typescript': [/interface\s+\w+/, /type\s+\w+\s*=/, /:\s*string/, /:\s*number/],
      'python': [/def\s+\w+/, /import\s+\w+/, /from\s+\w+\s+import/, /if\s+__name__/],
      'html': [/<html/, /<div/, /<span/, /<head/],
      'css': [/\.\w+\s*{/, /#\w+\s*{/, /\w+:\s*\w+;/],
      'json': [/^\s*{/, /"[\w-]+"\s*:/],
      'sql': [/SELECT\s+/, /FROM\s+/, /WHERE\s+/, /INSERT\s+INTO/i],
    };
    
    for (const [lang, patterns] of Object.entries(languagePatterns)) {
      if (patterns.some(pattern => pattern.test(content))) {
        return lang;
      }
    }
    
    return 'text';
  }
}
```

### 5. 📝 Markdown笔记功能

#### 功能特性
- 实时预览
- 语法高亮
- 文件夹分类
- 标签系统
- 全文搜索
- 导出功能

#### 编辑器实现
```javascript
// renderer/scripts/managers/NotesUI.js
class NotesUI {
  constructor() {
    this.notes = [];
    this.currentNote = null;
    this.folders = [];
    this.isPreviewMode = false;
    this.editor = null;
    this.init();
  }
  
  init() {
    this.initEditor();
    this.bindEvents();
    this.loadNotes();
  }
  
  initEditor() {
    this.editor = document.getElementById('note-editor');
    this.preview = document.getElementById('note-preview');
    
    // 实时预览
    this.editor.addEventListener('input', (e) => {
      if (this.isPreviewMode) {
        this.updatePreview();
      }
    });
    
    // 快捷键支持
    this.editor.addEventListener('keydown', (e) => {
      this.handleKeyShortcuts(e);
    });
  }
  
  updatePreview() {
    const markdown = this.editor.value;
    const html = this.renderMarkdown(markdown);
    this.preview.innerHTML = html;
  }
  
  renderMarkdown(markdown) {
    // 基础 Markdown 渲染
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/!\[([^\]]*)\]\(([^\)]+)\)/gim, '<img alt="$1" src="$2" />')
      .replace(/\[([^\]]+)\]\(([^\)]+)\)/gim, '<a href="$2">$1</a>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/```(\w+)?\n([\s\S]*?)```/gim, '<pre><code class="language-$1">$2</code></pre>')
      .replace(/\n/gim, '<br>');
  }
  
  handleKeyShortcuts(e) {
    if (e.ctrlKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          this.saveCurrentNote();
          break;
        case 'b':
          e.preventDefault();
          this.wrapSelection('**', '**');
          break;
        case 'i':
          e.preventDefault();
          this.wrapSelection('*', '*');
          break;
      }
    }
  }
  
  wrapSelection(before, after) {
    const start = this.editor.selectionStart;
    const end = this.editor.selectionEnd;
    const selectedText = this.editor.value.substring(start, end);
    const replacement = before + selectedText + after;
    
    this.editor.setRangeText(replacement, start, end, 'select');
  }
}
```

### 6. 🍅 番茄时钟功能

#### 功能特性
- 25分钟工作时间 + 5分钟休息时间
- 可自定义时间长度
- 声音提醒
- 与待办事项集成
- 统计功能

#### 实现代码
```javascript
// renderer/scripts/managers/PomodoroUI.js
class PomodoroUI {
  constructor() {
    this.isRunning = false;
    this.currentSession = 'work'; // 'work' | 'break' | 'longBreak'
    this.timeRemaining = 25 * 60; // 25分钟
    this.timer = null;
    this.sessions = {
      work: 25 * 60,
      break: 5 * 60,
      longBreak: 15 * 60
    };
    this.completedPomodoros = 0;
    this.init();
  }
  
  init() {
    this.bindEvents();
    this.updateDisplay();
  }
  
  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.timer = setInterval(() => {
        this.tick();
      }, 1000);
      this.updateControls();
    }
  }
  
  pause() {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.updateControls();
  }
  
  reset() {
    this.pause();
    this.timeRemaining = this.sessions[this.currentSession];
    this.updateDisplay();
  }
  
  tick() {
    this.timeRemaining--;
    this.updateDisplay();
    
    if (this.timeRemaining <= 0) {
      this.sessionComplete();
    }
  }
  
  sessionComplete() {
    this.pause();
    this.playNotificationSound();
    this.showNotification();
    
    if (this.currentSession === 'work') {
      this.completedPomodoros++;
      // 每4个番茄时钟后长休息
      if (this.completedPomodoros % 4 === 0) {
        this.switchSession('longBreak');
      } else {
        this.switchSession('break');
      }
    } else {
      this.switchSession('work');
    }
  }
  
  switchSession(sessionType) {
    this.currentSession = sessionType;
    this.timeRemaining = this.sessions[sessionType];
    this.updateDisplay();
    this.updateSessionIndicator();
  }
  
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  updateDisplay() {
    const display = document.getElementById('pomodoro-time');
    display.textContent = this.formatTime(this.timeRemaining);
    
    // 更新进度条
    const progress = document.getElementById('pomodoro-progress');
    const total = this.sessions[this.currentSession];
    const percentage = ((total - this.timeRemaining) / total) * 100;
    progress.style.width = `${percentage}%`;
  }
}
```

### 7. 🎨 主题系统

#### 主题配置
```css
/* renderer/styles/themes.css */
:root {
  /* 默认主题 */
  --primary-color: #007acc;
  --secondary-color: #f0f0f0;
  --background-color: rgba(255, 255, 255, 0.9);
  --text-color: #333;
  --border-color: #ddd;
  --shadow-color: rgba(0, 0, 0, 0.1);
  
  /* 毛玻璃效果 */
  --glass-bg: rgba(255, 255, 255, 0.8);
  --glass-border: rgba(255, 255, 255, 0.2);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  --glass-backdrop: blur(10px);
}

[data-theme="dark"] {
  --primary-color: #0d7377;
  --secondary-color: #2a2a2a;
  --background-color: rgba(30, 30, 30, 0.9);
  --text-color: #e0e0e0;
  --border-color: #444;
  --shadow-color: rgba(0, 0, 0, 0.3);
  
  --glass-bg: rgba(30, 30, 30, 0.8);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

[data-theme="blue"] {
  --primary-color: #1e3a8a;
  --background-color: rgba(59, 130, 246, 0.1);
  --glass-bg: rgba(59, 130, 246, 0.2);
}

/* 毛玻璃效果基础类 */
.glass {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-backdrop);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
}
```

## 开发流程

### 1. 环境搭建
```bash
# 克隆项目
git clone https://github.com/longdz/clipboard-list.git
cd clipboard-list

# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建项目
npm run build

# 启动应用
npm start
```

### 2. 开发规范

#### TypeScript 规范
- 使用严格模式
- 所有公共接口必须有类型定义
- 使用 async/await 处理异步操作
- 错误处理使用 try-catch

#### CSS 规范
- 使用 CSS 变量定义主题
- 采用 BEM 命名规范
- 响应式设计
- 优先使用 Flexbox 和 Grid

#### JavaScript 规范
- ES6+ 语法
- 模块化开发
- 事件驱动架构
- 单一职责原则

### 3. 数据流设计

```
用户操作 → UI管理器 → IPC通信 → 主进程管理器 → 数据服务 → 本地存储
    ↓                                                    ↓
UI更新 ← UI管理器 ← IPC通信 ← 主进程管理器 ← 事件通知 ← 数据变化
```

### 4. 错误处理

#### 主进程错误处理
```typescript
// src/utils/Logger.ts
export class Logger {
  static error(message: string, error?: Error): void {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error);
    // 写入日志文件
    this.writeToFile('error', message, error);
  }
  
  static warn(message: string): void {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`);
    this.writeToFile('warn', message);
  }
  
  static info(message: string): void {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
    this.writeToFile('info', message);
  }
}
```

#### 渲染进程错误处理
```javascript
// 全局错误捕获
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  window.electronAPI.logError(event.error.message, event.error.stack);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  window.electronAPI.logError('Unhandled Promise Rejection', event.reason);
});
```

### 5. 性能优化

#### 主进程优化
- 懒加载非关键模块
- 使用 Worker 线程处理大数据
- 内存使用监控
- 定期清理无用数据

#### 渲染进程优化
- 虚拟滚动处理大列表
- 图片懒加载
- 防抖/节流处理高频事件
- DOM 操作批量处理

### 6. 测试策略

#### 单元测试
```typescript
// 使用 Jest 进行单元测试
describe('ClipboardManager', () => {
  let manager: ClipboardManager;
  
  beforeEach(() => {
    manager = new ClipboardManager({
      maxHistorySize: 100,
      enableAutoSave: true,
      enableNotification: true,
      excludedApps: []
    });
  });
  
  test('should detect code content correctly', () => {
    const jsCode = 'function test() { return true; }';
    expect(manager.detectContentType(jsCode)).toBe('code');
  });
});
```

#### 集成测试
- 使用 Spectron 进行 E2E 测试
- 测试 IPC 通信
- 测试窗口行为
- 测试数据持久化

### 7. 构建和分发

#### 构建配置
```json
// electron-builder 配置
{
  "build": {
    "appId": "com.longdz.clipboard-list",
    "productName": "ClipBoard List",
    "directories": {
      "output": "dist"
    },
    "files": [
      "dist/**/*",
      "renderer/**/*",
      "assets/**/*",
      "node_modules/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "assets/icons/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

## 最佳实践

### 1. 安全性
- 禁用 Node.js 集成
- 启用上下文隔离
- 验证所有外部输入
- 使用 CSP 防止 XSS

### 2. 用户体验
- 响应式设计
- 流畅动画效果
- 快捷键支持
- 错误提示友好

### 3. 维护性
- 模块化设计
- 完善的注释
- 类型定义完整
- 单元测试覆盖

### 4. 扩展性
- 插件系统设计
- 主题系统
- 配置化功能
- API 接口标准化

这个开发文档提供了完整的技术架构和开发指南，采用低耦合的模块化设计，便于团队协作和项目维护。每个功能模块都有详细的实现示例，可以根据具体需求进行调整和扩展。
  
  // 设置窗口吸附
  setupWindowDocking(): void
  
  // 处理窗口移动
  handleWindowMove(bounds: Rectangle): void
  
  // 自动隐藏/显示
  setupAutoHide(): void
  
  // 鼠标悬停检测
  handleMouseEvents(): void
}
```

#### 开发要点:
- 监听窗口移动事件
- 计算屏幕边缘距离
- 实现平滑的吸附动画
- 鼠标进入/离开检测

### 3. ✅ 待办清单功能

#### 文件: `renderer/scripts/managers/TodoUI.js`
```javascript
export class TodoUI {
  // 渲染待办列表
  renderTodoList(todos, filter)
  
  // 添加待办事项
  addTodo(todoData)
  
  // 编辑待办事项
  editTodo(todoId, newData)
  
  // 删除待办事项
  deleteTodo(todoId)
  
  // 拖拽排序
  setupDragAndDrop()
  
  // 筛选功能
  filterTodos(filterType)
  
  // 优先级管理
  setPriority(todoId, priority)
}
```

#### 开发要点:
- 支持拖拽排序
- 优先级可视化
- 状态筛选
- 与番茄时钟集成

### 4. 💻 剪切板管理功能

#### 文件: `src/managers/ClipboardManager.ts`
```typescript
export class ClipboardManager {
  // 监控剪切板变化
  startMonitoring(): void
  
  // 检测内容类型
  detectContentType(content: string): ContentType
  
  // 处理代码片段
  handleCodeSnippet(content: string): CodeInfo
  
  // 保存剪切板历史
  saveClipboardItem(item: ClipboardItem): void
  
  // 获取剪切板历史
  getClipboardHistory(): ClipboardItem[]
}
```

#### 开发要点:
- 实时剪切板监控
- 智能内容类型识别
- 代码语法高亮
- 历史记录管理

### 5. 📝 Markdown 笔记功能

#### 文件: `renderer/scripts/managers/NotesUI.js`
```javascript
export class NotesUI {
  // 创建新笔记
  createNewNote()
  
  // 保存笔记
  saveNote(noteId, content)
  
  // 删除笔记
  deleteNote(noteId)
  
  // 实时预览
  updatePreview(markdown)
  
  // 搜索笔记
  searchNotes(query)
  
  // 导出笔记
  exportNote(noteId, format)
}
```

#### 开发要点:
- Markdown 实时预览
- 语法高亮
- 全文搜索
- 多种导出格式

### 6. 🍅 番茄时钟功能

#### 文件: `renderer/scripts/managers/PomodoroUI.js`
```javascript
export class PomodoroUI {
  // 开始番茄时钟
  startPomodoro(duration)
  
  // 暂停/恢复
  pauseResume()
  
  // 重置计时器
  resetTimer()
  
  // 处理时间到达
  handleTimeUp()
  
  // 显示通知
  showPomodoroNotification(type)
  
  // 统计功能
  updateStatistics()
}
```

#### 开发要点:
- 精确计时
- 声音/视觉提醒
- 统计数据
- 与待办事项集成

### 7. 🎨 主题系统功能

#### 文件: `renderer/scripts/services/ThemeService.js`
```javascript
export class ThemeService {
  // 设置主题
  setTheme(themeName)
  
  // 获取当前主题
  getCurrentTheme()
  
  // 切换毛玻璃效果
  toggleGlassEffect(enabled)
  
  // 监听系统主题变化
  watchSystemTheme()
  
  // 自定义主题
  createCustomTheme(themeData)
}
```

#### 开发要点:
- CSS 变量系统
- 平滑过渡动画
- 系统主题跟随
- 自定义主题支持

### 8. 💾 数据持久化功能

#### 文件: `src/managers/FileManager.ts`
```typescript
export class FileManager {
  // 保存数据
  saveData(dataType: string, data: any): Promise<void>
  
  // 加载数据
  loadData(dataType: string): Promise<any>
  
  // 备份数据
  backupData(): Promise<void>
  
  // 恢复数据
  restoreData(backupPath: string): Promise<void>
  
  // 数据迁移
  migrateData(oldVersion: string, newVersion: string): Promise<void>
}
```

#### 开发要点:
- JSON 文件存储
- 数据备份恢复
- 版本迁移
- 错误处理

## 开发流程

### 阶段一：基础框架 (第1-2周)
1. 创建项目结构
2. 设置开发环境
3. 实现基础窗口管理
4. 建立 IPC 通信框架

### 阶段二：核心功能 (第3-4周)
1. 剪切板监控和管理
2. 屏幕吸附功能
3. 系统托盘集成
4. 数据持久化

### 阶段三：用户界面 (第5-6周)
1. 待办清单功能
2. Markdown 笔记
3. 番茄时钟
4. 设置界面

### 阶段四：优化完善 (第7-8周)
1. 主题系统
2. 性能优化
3. 错误处理
4. 用户体验改进

## 代码规范

### TypeScript/JavaScript 规范
- 使用 ES6+ 语法
- 采用模块化设计
- 遵循单一职责原则
- 添加详细的 JSDoc 注释
- 使用 async/await 处理异步操作

### 文件命名规范
- 类文件使用 PascalCase: `WindowManager.ts`
- 服务文件使用 PascalCase + Service: `DataService.js`
- 工具文件使用 PascalCase + Utils: `DateUtils.js`
- 组件文件使用 PascalCase: `Modal.js`

### 代码组织原则
- 每个文件专注单一功能
- 避免循环依赖
- 使用接口定义契约
- 实现依赖注入
- 保持低耦合高内聚

## 测试策略

### 单元测试
- 每个管理器类都要有对应测试
- 覆盖主要业务逻辑
- 模拟外部依赖

### 集成测试
- IPC 通信测试
- 数据持久化测试
- 窗口管理测试

### 用户体验测试
- 界面响应速度
- 内存使用情况
- 启动时间测试

## 部署打包

### 开发环境
```powershell
npm run dev
```

### 生产构建
```powershell
npm run build
npm run dist
```

### 发布流程
1. 版本号更新
2. 变更日志编写
3. 自动化测试
4. 打包分发
5. 更新检查服务

## 维护升级

### 版本管理
- 语义化版本控制
- 变更日志维护
- 向后兼容性

### 数据迁移
- 版本检测
- 自动迁移脚本
- 备份恢复机制

### 性能监控
- 内存使用监控
- CPU 使用率
- 启动时间统计
- 用户行为分析

## 安全考虑

### Electron 安全
- 禁用 Node.js 集成
- 启用上下文隔离
- 内容安全策略 (CSP)
- 最小权限原则

### 数据安全
- 本地数据加密
- 敏感信息处理
- 安全的 IPC 通信
- 输入验证和清理

这份开发文档提供了完整的架构设计和开发指南，确保代码的可维护性和可扩展性。每个模块都有明确的职责边界，便于团队协作开发。
