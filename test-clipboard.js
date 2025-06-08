// 简单的剪切板测试脚本
const {
    clipboard
} = require('electron');

console.log('当前剪切板内容:', clipboard.readText());

// 模拟复制一些测试文本
const testText = `测试文本 - ${new Date().toLocaleTimeString()}`;
clipboard.writeText(testText);

console.log('已写入剪切板:', testText);
console.log('验证剪切板内容:', clipboard.readText());