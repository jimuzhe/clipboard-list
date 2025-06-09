# 移记产品介绍页部署指南

## 部署方案

### 1. GitHub Pages（推荐 - 免费）

#### 步骤：
1. 在 GitHub 创建新仓库 `clipboard-list-website`
2. 将 `deploy` 文件夹内容上传到仓库
3. 在仓库设置中启用 GitHub Pages
4. 访问 `https://your-username.github.io/clipboard-list-website`

#### 优点：
- 完全免费
- 自动 HTTPS
- CDN 加速
- 版本控制

#### 命令：
```bash
cd deploy
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/clipboard-list-website.git
git push -u origin main
```

### 2. Vercel（推荐 - 免费）

#### 步骤：
1. 访问 vercel.com
2. 使用 GitHub 账户登录
3. 导入仓库或直接拖拽 `deploy` 文件夹
4. 自动部署完成

#### 优点：
- 自动部署
- 全球 CDN
- 自定义域名
- 分析功能

### 3. Netlify（推荐 - 免费）

#### 步骤：
1. 访问 netlify.com
2. 拖拽 `deploy` 文件夹到部署区域
3. 获得临时域名，可绑定自定义域名

#### 优点：
- 拖拽部署
- 表单处理
- 函数支持
- 分析功能

### 4. 传统服务器部署

#### 步骤：
1. 将 `deploy` 文件夹上传到服务器
2. 配置 Web 服务器（Apache/Nginx）
3. 设置域名解析

#### Nginx 配置示例：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/deploy;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    # 启用 gzip 压缩
    gzip on;
    gzip_types text/css application/javascript;
    
    # 设置缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 文件结构

```
deploy/
├── index.html          # 主页面
├── styles.css          # 样式文件
├── script.js           # 交互脚本
└── assets/
    ├── app-icon.png     # 应用图标
    └── tray-icon.png    # 托盘图标
```

## 注意事项

1. **图标文件**：确保 `assets/app-icon.png` 存在
2. **下载链接**：更新 GitHub 仓库链接和下载地址
3. **SEO 优化**：已添加 meta 标签和 Open Graph
4. **性能优化**：使用 CDN 字体，优化图片大小
5. **响应式设计**：支持移动端访问

## 自定义配置

在部署前，请修改以下内容：

1. **GitHub 链接**：
   - 将 `your-username` 替换为实际的 GitHub 用户名
   - 更新仓库名称

2. **下载地址**：
   - 上传安装包到 GitHub Releases
   - 更新下载链接

3. **联系信息**：
   - 更新邮箱地址
   - 添加社交媒体链接

4. **域名**：
   - 绑定自定义域名
   - 配置 SSL 证书

## 性能监控

部署后建议：
- 使用 Google Analytics 追踪访问
- 监控下载转化率
- 定期检查页面加载速度
- 收集用户反馈
