// 测试单例功能的脚本
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 测试应用单例功能...');

// 应用路径
const appPath = path.join(__dirname, 'dist', 'main.js');

console.log('📍 应用路径:', appPath);

// 启动第一个实例
console.log('🟢 启动第一个实例...');
const firstInstance = spawn('node', [appPath], {
    stdio: 'pipe',
    detached: false
});

firstInstance.stdout.on('data', (data) => {
    console.log('📤 实例1输出:', data.toString().trim());
});

firstInstance.stderr.on('data', (data) => {
    console.log('❌ 实例1错误:', data.toString().trim());
});

// 等待2秒后启动第二个实例
setTimeout(() => {
    console.log('🟡 启动第二个实例...');
    const secondInstance = spawn('node', [appPath], {
        stdio: 'pipe',
        detached: false
    });

    secondInstance.stdout.on('data', (data) => {
        console.log('📤 实例2输出:', data.toString().trim());
    });

    secondInstance.stderr.on('data', (data) => {
        console.log('❌ 实例2错误:', data.toString().trim());
    });

    secondInstance.on('close', (code) => {
        console.log(`🔴 第二个实例退出，退出代码: ${code}`);
        if (code === 0) {
            console.log('✅ 单例功能正常工作！第二个实例正确退出');
        } else {
            console.log('❌ 第二个实例异常退出');
        }
        
        // 清理第一个实例
        setTimeout(() => {
            console.log('🧹 清理第一个实例...');
            firstInstance.kill();
        }, 1000);
    });

}, 2000);

firstInstance.on('close', (code) => {
    console.log(`🔴 第一个实例退出，退出代码: ${code}`);
});

// 10秒后强制退出测试
setTimeout(() => {
    console.log('⏰ 测试超时，强制退出');
    firstInstance.kill();
    process.exit(0);
}, 10000);
