// iOS 风格产品介绍页交互脚本

document.addEventListener('DOMContentLoaded', function() {
    // 导航栏滚动效果
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // 平滑滚动到锚点
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
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
    
    // 功能卡片悬停效果
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
            this.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '';
        });
    });
    
    // 应用预览窗口交互
    const appWindow = document.querySelector('.app-window');
    if (appWindow) {
        let isHovering = false;
        
        appWindow.addEventListener('mouseenter', function() {
            isHovering = true;
            this.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1.05)';
        });
        
        appWindow.addEventListener('mouseleave', function() {
            isHovering = false;
            this.style.transform = 'perspective(1000px) rotateY(-5deg) rotateX(5deg) scale(1)';
        });
        
        // 鼠标移动效果
        appWindow.addEventListener('mousemove', function(e) {
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
    
    // 按钮点击动画
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
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
    
    // 滚动动画观察器
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // 观察需要动画的元素
    document.querySelectorAll('.feature-card, .screenshot-item, .download-content').forEach(el => {
        observer.observe(el);
    });
    
    // 类型写字机效果（可选）
    const heroDescription = document.querySelector('.hero-description');
    if (heroDescription) {
        const text = heroDescription.textContent;
        heroDescription.textContent = '';
        
        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                heroDescription.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 30);
            }
        };
        
        // 延迟开始打字效果
        setTimeout(typeWriter, 1000);
    }
    
    // 下载按钮点击统计（可选）
    const downloadBtn = document.querySelector('.btn-download');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            // 这里可以添加下载统计逻辑
            console.log('Download button clicked');
            
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
            background: var(--success-color);
            color: white;
            padding: 16px 24px;
            border-radius: var(--border-radius-medium);
            box-shadow: var(--shadow-large);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            font-weight: 500;
        `;
        notification.textContent = '下载即将开始...';
        
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
    
    // 添加粒子背景效果（可选）
    function createParticles() {
        const hero = document.querySelector('.hero');
        if (!hero) return;
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: rgba(0, 122, 255, 0.3);
                border-radius: 50%;
                animation: float ${5 + Math.random() * 10}s infinite linear;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                pointer-events: none;
            `;
            hero.appendChild(particle);
        }
    }
    
    // 创建粒子（如果需要）
    // createParticles();
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
    
    @keyframes float {
        0%, 100% {
            transform: translateY(0) rotate(0deg);
        }
        50% {
            transform: translateY(-20px) rotate(180deg);
        }
    }
    
    .animate-in {
        animation: fadeInUp 0.8s ease-out;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(40px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

document.head.appendChild(style);
