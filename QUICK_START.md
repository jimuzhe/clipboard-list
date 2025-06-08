# 🚀 快速开始 - 立即重构代码

## 一键重构脚本

为了快速将当前代码重构为模块化架构，您可以按照以下步骤操作：

### 第一步：创建目录结构

```bash
# 在项目根目录执行
mkdir -p src/managers src/services src/utils src/types
mkdir -p renderer/scripts/managers renderer/scripts/services renderer/scripts/components renderer/scripts/utils
```

### 第二步：创建类型定义

首先创建核心类型定义，这是整个架构的基础：

```bash
# 创建类型定义文件
touch src/types/index.ts src/types/clipboard.ts src/types/todo.ts src/types/notes.ts
```

### 第三步：执行重构命令

我为您准备了一系列重构命令，可以逐步执行：

#### 3.1 主进程重构

```bash
# 移动现有文件到合适位置
mv src/main.ts src/main.old.ts
mv src/preload.ts src/preload.old.ts
```

#### 3.2 渲染进程重构

```bash
# 备份现有文件
cp renderer/renderer.js renderer/renderer.old.js
cp renderer/styles.css renderer/styles.old.css
```

## 重构优先级

### 🔥 高优先级（立即执行）
1. **类型定义** - 建立类型系统
2. **WindowManager** - 窗口管理核心
3. **TrayManager** - 托盘功能
4. **IPCService** - 通信桥梁

### 🔶 中优先级（第二阶段）
1. **ClipboardManager** - 剪切板核心功能
2. **DataService** - 数据持久化
3. **ClipboardUI** - 剪切板界面
4. **App主控制器** - 渲染进程入口

### 🔷 低优先级（优化阶段）
1. **其他UI管理器** - TodoUI, NotesUI等
2. **组件系统** - Modal, Notification等
3. **工具类** - Logger, Utils等

## 分步骤重构指南

### 阶段一：建立基础架构（预计2小时）

#### 1. 创建类型定义（30分钟）

**src/types/index.ts**
```typescript
export * from './clipboard';
export * from './todo';
export * from './notes';

export interface AppConfig {
  theme: string;
  autoStart: boolean;
  window: WindowConfig;
  clipboard: ClipboardConfig;
  pomodoro: PomodoroConfig;
}

export interface WindowConfig {
  alwaysOnTop: boolean;
  dockToSide: boolean;
  autoHide: boolean;
  width: number;
  height: number;
}
```

#### 2. 创建基础管理器（60分钟）

按照重构指南创建：
- WindowManager.ts
- TrayManager.ts  
- IPCService.ts

#### 3. 重构主进程入口（30分钟）

创建新的 main.ts，整合各个管理器

### 阶段二：核心功能迁移（预计3小时）

#### 1. 剪切板功能迁移（90分钟）
- ClipboardManager.ts (主进程)
- ClipboardUI.js (渲染进程)

#### 2. 数据服务创建（60分钟）
- DataService.ts
- 数据持久化逻辑

#### 3. 渲染进程重构（30分钟）
- App.js 主控制器
- 基础服务层

### 阶段三：功能完善（预计4小时）

#### 1. 待办功能迁移（120分钟）
- TodoUI.js
- 拖拽排序
- 番茄时钟集成

#### 2. 笔记功能迁移（90分钟）
- NotesUI.js
- Markdown 渲染

#### 3. 设置功能迁移（30分钟）
- SettingsUI.js
- 主题切换

### 阶段四：组件化和优化（预计2小时）

#### 1. 组件系统（60分钟）
- Modal.js
- Notification.js

#### 2. 工具类和优化（60分钟）
- Logger.ts
- 错误处理
- 性能优化

## 重构验证清单

### ✅ 功能验证
- [ ] 窗口正常创建和显示
- [ ] 托盘图标和菜单正常
- [ ] 剪切板监听正常工作
- [ ] 数据持久化正常
- [ ] 主题切换正常
- [ ] 所有标签页可正常切换

### ✅ 架构验证
- [ ] 模块间依赖关系清晰
- [ ] IPC 通信正常
- [ ] 事件系统工作正常
- [ ] 错误处理机制完善

### ✅ 性能验证
- [ ] 启动速度正常
- [ ] 内存使用合理
- [ ] 无明显性能下降

## 常见问题解决

### Q1: 模块导入错误
```typescript
// 确保使用正确的导入路径
import { WindowManager } from './managers/WindowManager';
// 而不是
import WindowManager from './managers/WindowManager';
```

### Q2: IPC 通信失败
```typescript
// 确保在 preload.js 中正确暴露 API
contextBridge.exposeInMainWorld('electronAPI', {
  clipboard: {
    getHistory: () => ipcRenderer.invoke('clipboard:getHistory'),
    // ...
  }
});
```

### Q3: 样式丢失
```css
/* 确保保留现有的 CSS 变量和类名 */
:root {
  --primary-color: #007acc;
  /* ... */
}
```

## 重构后的文件结构

```
src/
├── main.ts                    # ✅ 重构完成
├── preload.ts                 # ✅ 重构完成
├── managers/
│   ├── WindowManager.ts       # ✅ 创建完成
│   ├── TrayManager.ts         # ✅ 创建完成
│   ├── ClipboardManager.ts    # 🔄 进行中
│   └── AutoStartManager.ts    # ⏳ 待创建
├── services/
│   ├── IPCService.ts          # ✅ 创建完成
│   ├── DataService.ts         # 🔄 进行中
│   └── NotificationService.ts # ⏳ 待创建
├── utils/
│   ├── Logger.ts              # ⏳ 待创建
│   └── Config.ts              # ⏳ 待创建
└── types/
    ├── index.ts               # ✅ 创建完成
    ├── clipboard.ts           # ✅ 创建完成
    ├── todo.ts                # ⏳ 待创建
    └── notes.ts               # ⏳ 待创建

renderer/scripts/
├── App.js                     # 🔄 进行中
├── managers/
│   ├── ClipboardUI.js         # 🔄 进行中
│   ├── TodoUI.js              # ⏳ 待创建
│   ├── NotesUI.js             # ⏳ 待创建
│   └── SettingsUI.js          # ⏳ 待创建
├── services/
│   ├── ThemeService.js        # ⏳ 待创建
│   └── DataService.js         # ⏳ 待创建
└── components/
    ├── Modal.js               # ⏳ 待创建
    └── Notification.js        # ⏳ 待创建
```

## 立即开始

1. **查看当前代码**: 先理解现有代码结构
2. **创建目录**: 执行目录创建命令
3. **开始重构**: 从类型定义开始
4. **逐步验证**: 每完成一个模块就测试一次
5. **保持备份**: 重要修改前先备份

准备好开始重构了吗？让我们从第一步开始！
