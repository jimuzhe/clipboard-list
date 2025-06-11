// Apple风格产品页交互脚本 - 移记 QuiverNote

document.addEventListener('DOMContentLoaded', function () {
    // 导航栏滚动效果
    const navbar = document.querySelector('.apple-nav');

    if (navbar) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 20) {
                navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            } else {
                navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
            }
        });
    }

    // 平滑滚动到锚点
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 60;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 浮动卡片动画
    const floatingCards = document.querySelectorAll('.feature-card.floating');
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 150);
            }
        });
    }, observerOptions);

    floatingCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease-out';
        cardObserver.observe(card);
    });

    // 功能展示区域动画
    const featureShowcases = document.querySelectorAll('.feature-showcase');

    const showcaseObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const content = entry.target.querySelector('.feature-content');
                const visual = entry.target.querySelector('.feature-visual');

                if (content) {
                    content.style.opacity = '1';
                    content.style.transform = 'translateX(0)';
                }

                if (visual) {
                    visual.style.opacity = '1';
                    visual.style.transform = 'translateX(0)';
                }
            }
        });
    }, observerOptions);

    featureShowcases.forEach(showcase => {
        const content = showcase.querySelector('.feature-content');
        const visual = showcase.querySelector('.feature-visual');

        if (content) {
            content.style.opacity = '0';
            content.style.transform = 'translateX(-50px)';
            content.style.transition = 'all 0.8s ease-out';
        }

        if (visual) {
            visual.style.opacity = '0';
            visual.style.transform = 'translateX(50px)';
            visual.style.transition = 'all 0.8s ease-out 0.2s';
        }

        showcaseObserver.observe(showcase);
    });

    // 设计卡片悬停效果
    const designCards = document.querySelectorAll('.design-card');

    designCards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(-4px) scale(1)';
        });
    });

    // 演示界面交互
    const demoItems = document.querySelectorAll('.demo-item, .clipboard-item, .todo-item');

    demoItems.forEach(item => {
        item.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
        });

        item.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '';
        });
    });

    // 动作按钮点击效果
    const actionButtons = document.querySelectorAll('.action-btn, .btn-apple-primary, .btn-download-primary');

    actionButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            // 创建涟漪效果
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple-effect');

            this.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // 视差滚动效果
    const heroVisual = document.querySelector('.hero-visual');

    if (heroVisual) {
        window.addEventListener('scroll', function () {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            heroVisual.style.transform = `translateY(${rate}px)`;
        });
    }

    // 页面加载动画
    const heroContent = document.querySelector('.hero-content');

    if (heroContent) {
        setTimeout(() => {
            heroContent.style.opacity = '1';
            heroContent.style.transform = 'translateY(0)';
        }, 100);

        heroContent.style.opacity = '0';
        heroContent.style.transform = 'translateY(30px)';
        heroContent.style.transition = 'all 0.8s ease-out';
    }

    // 统计数字动画
    const statNumbers = document.querySelectorAll('.stat-number');

    const animateNumbers = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const finalText = target.textContent;

                if (finalText === '∞') {
                    // 无限符号特殊动画
                    target.style.animation = 'pulse 2s ease-in-out infinite';
                } else if (finalText === 'AI') {
                    // AI文字特殊动画
                    target.style.animation = 'glow 3s ease-in-out infinite';
                } else if (finalText.includes('%')) {
                    // 百分比数字动画
                    animatePercentage(target, parseInt(finalText));
                }
            }
        });
    };

    const numberObserver = new IntersectionObserver(animateNumbers, observerOptions);

    statNumbers.forEach(number => {
        numberObserver.observe(number);
    });

    // 百分比动画函数
    function animatePercentage(element, target) {
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current) + '%';
        }, 30);
    }

    // 添加必要的CSS动画
    const style = document.createElement('style');
    style.textContent = `
        .ripple-effect {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        }
        
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        @keyframes glow {
            0%, 100% {
                text-shadow: 0 0 5px rgba(0, 122, 255, 0.5);
            }
            50% {
                text-shadow: 0 0 20px rgba(0, 122, 255, 0.8);
            }
        }
    `;
    document.head.appendChild(style);

    // 键盘导航支持
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });

    document.addEventListener('mousedown', function () {
        document.body.classList.remove('keyboard-navigation');
    });

    // 性能优化：防抖滚动事件
    let scrollTimeout;
    window.addEventListener('scroll', function () {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }

        scrollTimeout = setTimeout(function () {
            // 在这里执行需要防抖的滚动相关操作
        }, 10);
    });
    console.log('移记 QuiverNote - Apple风格产品页已加载完成');
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