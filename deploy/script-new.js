// iOS 风格产品介绍页交互脚本 - v2.0

document.addEventListener('DOMContentLoaded', function () {
    // 导航栏滚动效果
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', function () {
        if (window.scrollY > 30) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 平滑滚动到锚点
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 版本亮点卡片动画效果
    const versionHighlightCards = document.querySelectorAll('.highlight-card');
    const highlightObserverOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const versionHighlightObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 200);
            }
        });
    }, highlightObserverOptions);

    versionHighlightCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        versionHighlightObserver.observe(card);
    });

    // 功能卡片悬停效果增强
    const mainFeatureCards = document.querySelectorAll('.feature-card');
    mainFeatureCards.forEach((card, index) => {
        // 添加延迟动画
        card.style.animationDelay = `${index * 0.1}s`;

        card.addEventListener('mouseenter', function () {
            // 添加悬停时的微妙旋转和发光效果
            const icon = this.querySelector('.icon-wrapper');
            if (icon) {
                icon.style.transform = 'scale(1.15) rotateY(15deg)';
                icon.style.boxShadow = '0 8px 25px rgba(0, 122, 255, 0.3)';
            }
        });

        card.addEventListener('mouseleave', function () {
            const icon = this.querySelector('.icon-wrapper');
            if (icon) {
                icon.style.transform = 'scale(1) rotateY(0deg)';
                icon.style.boxShadow = 'none';
            }
        });
    });

    // 应用预览窗口交互增强
    const appWindow = document.querySelector('.app-window');
    if (appWindow) {
        let isHovering = false;

        appWindow.addEventListener('mouseenter', function () {
            isHovering = true;
            this.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1.05)';
        });

        appWindow.addEventListener('mouseleave', function () {
            isHovering = false;
            this.style.transform = 'perspective(1000px) rotateY(-5deg) rotateX(5deg) scale(1)';
        });

        // 鼠标移动效果
        appWindow.addEventListener('mousemove', function (e) {
            if (!isHovering) return;

            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;

            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
        });
    }

    // 下载按钮特效
    const downloadBtn = document.querySelector('.btn-download');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function (e) {
            // 显示下载动画
            this.style.position = 'relative';
            this.style.overflow = 'hidden';

            // 创建下载进度指示器
            const progress = document.createElement('div');
            progress.style.cssText = `
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                animation: downloadProgress 2s ease-in-out;
            `;

            this.appendChild(progress);

            // 2秒后移除进度指示器
            setTimeout(() => {
                progress.remove();
            }, 2000);

            // 显示下载提示
            showDownloadNotification();
        });
    }

    // 下载通知
    function showDownloadNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #34C759;
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 16px 32px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            font-weight: 500;
        `;
        notification.textContent = '✨ 移记 v2.0.0 下载即将开始...';

        document.body.appendChild(notification);

        // 显示动画
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // 自动隐藏
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // 按钮点击动画
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function (e) {
            // 创建波纹效果
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                pointer-events: none;
                left: ${x}px;
                top: ${y}px;
                animation: ripple 0.6s ease-out;
            `;

            this.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
});

// CSS 动画定义
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        0% {
            transform: scale(0);
            opacity: 1;
        }
        100% {
            transform: scale(2);
            opacity: 0;
        }
    }
    
    @keyframes downloadProgress {
        0% {
            left: -100%;
        }
        100% {
            left: 100%;
        }
    }
    
    /* 增强的悬停效果 */
    .feature-card:hover {
        animation: cardHover 0.3s ease-out;
    }
    
    @keyframes cardHover {
        0% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-4px) scale(1.01); }
        100% { transform: translateY(-8px) scale(1.02); }
    }
`;

document.head.appendChild(style);