# 自动部署脚本

# 检查是否在正确的目录
if (!(Test-Path "deploy")) {
    Write-Error "请在项目根目录运行此脚本"
    exit 1
}

Write-Host "🚀 开始部署移记产品介绍页..." -ForegroundColor Green

# 创建部署目录（如果不存在）
if (!(Test-Path "deploy")) {
    New-Item -ItemType Directory -Path "deploy"
    Write-Host "✅ 创建部署目录" -ForegroundColor Green
}

# 复制必要文件
Write-Host "📁 复制文件..." -ForegroundColor Yellow

# 复制样式和脚本文件
Copy-Item "intro-styles.css" "deploy\styles.css" -Force
Copy-Item "intro-script.js" "deploy\script.js" -Force

# 确保资源目录存在
if (!(Test-Path "deploy\assets")) {
    New-Item -ItemType Directory -Path "deploy\assets"
}

# 复制图标文件
Copy-Item "assets\app-icon.png" "deploy\assets\" -Force -ErrorAction SilentlyContinue
Copy-Item "assets\tray-icon.png" "deploy\assets\" -Force -ErrorAction SilentlyContinue

Write-Host "✅ 文件复制完成" -ForegroundColor Green

# 检查文件完整性
$requiredFiles = @(
    "deploy\index.html",
    "deploy\styles.css", 
    "deploy\script.js",
    "deploy\assets\app-icon.png"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (!(Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "❌ 缺少必要文件:" -ForegroundColor Red
    $missingFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}

Write-Host "✅ 文件完整性检查通过" -ForegroundColor Green

# 显示部署选项
Write-Host ""
Write-Host "🌐 选择部署方式:" -ForegroundColor Cyan
Write-Host "1. GitHub Pages (免费)" -ForegroundColor White
Write-Host "2. Vercel (免费)" -ForegroundColor White  
Write-Host "3. Netlify (免费)" -ForegroundColor White
Write-Host "4. 生成 ZIP 包 (手动上传)" -ForegroundColor White
Write-Host "5. 本地预览" -ForegroundColor White

$choice = Read-Host "请选择 (1-5)"

switch ($choice) {
    "1" {
        Write-Host "📖 GitHub Pages 部署指南:" -ForegroundColor Yellow
        Write-Host "1. 在 GitHub 创建新仓库 'clipboard-list-website'"
        Write-Host "2. 上传 deploy 文件夹内容到仓库"
        Write-Host "3. 在仓库设置中启用 GitHub Pages"
        Write-Host "4. 访问 https://your-username.github.io/clipboard-list-website"
        
        # 询问是否初始化 Git
        $initGit = Read-Host "是否初始化 Git 仓库? (y/N)"
        if ($initGit -eq "y" -or $initGit -eq "Y") {
            Set-Location "deploy"
            git init
            git add .
            git commit -m "Initial commit: 移记产品介绍页"
            Write-Host "✅ Git 仓库初始化完成" -ForegroundColor Green
            Write-Host "请添加远程仓库: git remote add origin <repository-url>" -ForegroundColor Yellow
            Set-Location ".."
        }
    }
    
    "2" {
        Write-Host "🚀 Vercel 部署指南:" -ForegroundColor Yellow
        Write-Host "1. 访问 vercel.com"
        Write-Host "2. 使用 GitHub 账户登录"
        Write-Host "3. 点击 'New Project' 导入仓库"
        Write-Host "4. 或直接拖拽 deploy 文件夹"
        Write-Host "5. 自动部署完成"
    }
    
    "3" {
        Write-Host "🎯 Netlify 部署指南:" -ForegroundColor Yellow
        Write-Host "1. 访问 netlify.com"
        Write-Host "2. 拖拽 deploy 文件夹到部署区域"
        Write-Host "3. 等待部署完成"
        Write-Host "4. 获得临时域名，可绑定自定义域名"
    }
    
    "4" {
        Write-Host "📦 创建 ZIP 部署包..." -ForegroundColor Yellow
        $zipPath = "clipboard-list-website.zip"
        
        # 删除旧的 ZIP 文件
        if (Test-Path $zipPath) {
            Remove-Item $zipPath -Force
        }
        
        # 创建 ZIP 文件
        Compress-Archive -Path "deploy\*" -DestinationPath $zipPath -Force
        Write-Host "✅ ZIP 包已创建: $zipPath" -ForegroundColor Green
        Write-Host "可以上传到任何支持静态网站的主机服务" -ForegroundColor Yellow
    }
    
    "5" {
        Write-Host "👀 启动本地预览..." -ForegroundColor Yellow
        
        # 检查是否安装了 Python 或 Node.js
        $pythonInstalled = Get-Command python -ErrorAction SilentlyContinue
        $nodeInstalled = Get-Command node -ErrorAction SilentlyContinue
        
        if ($pythonInstalled) {
            Write-Host "使用 Python 启动本地服务器..." -ForegroundColor Green
            Set-Location "deploy"
            Write-Host "本地预览地址: http://localhost:8000" -ForegroundColor Cyan
            python -m http.server 8000
            Set-Location ".."
        }
        elseif ($nodeInstalled) {
            Write-Host "使用 Node.js 启动本地服务器..." -ForegroundColor Green
            Set-Location "deploy"
            Write-Host "本地预览地址: http://localhost:3000" -ForegroundColor Cyan
            npx serve -p 3000
            Set-Location ".."
        }
        else {
            Write-Host "❌ 需要安装 Python 或 Node.js 才能启动本地服务器" -ForegroundColor Red
            Write-Host "或者直接在浏览器中打开 deploy\index.html" -ForegroundColor Yellow
        }
    }
    
    default {
        Write-Host "❌ 无效选择" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🎉 部署准备完成!" -ForegroundColor Green
Write-Host "部署文件位于: deploy\" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 部署后记得更新:" -ForegroundColor Yellow
Write-Host "- GitHub 仓库链接"
Write-Host "- 下载地址"
Write-Host "- 联系邮箱"
Write-Host "- 自定义域名"
