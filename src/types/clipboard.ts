// 剪切板条目接口
export interface ClipboardItem {
    id: string;
    content: string;
    type: ClipboardItemType;
    subType?: string; // 对于代码类型，存储语言类型
    size: number;
    timestamp: Date;
    isPinned: boolean;
    tags: string[];
    preview?: string; // 长文本的预览
    source?: string; // 来源应用程序
}

// 剪切板条目类型
export type ClipboardItemType = 'text' | 'image' | 'file' | 'code' | 'url' | 'email';

// 剪切板统计信息
export interface ClipboardStats {
    totalItems: number;
    textItems: number;
    codeItems: number;
    imageItems: number;
    fileItems: number;
    urlItems: number;
    emailItems: number;
    totalSize: number;
    oldestItem?: Date;
    newestItem?: Date;
}

// 剪切板搜索参数
export interface ClipboardSearchParams {
    query?: string;
    types?: ClipboardItemType[];
    tags?: string[];
    startDate?: Date;
    endDate?: Date;
    isPinned?: boolean;
    limit?: number;
    offset?: number;
}

// 剪切板过滤选项
export interface ClipboardFilter {
    type: ClipboardItemType | 'all';
    timeRange: 'today' | 'week' | 'month' | 'all';
    showPinned: boolean;
}

// 代码语言检测结果
export interface CodeDetectionResult {
    language: string;
    confidence: number;
    features: string[];
}

// 剪切板监听器配置
export interface ClipboardMonitorConfig {
    interval: number; // 检查间隔，毫秒
    enableImageCapture: boolean;
    enableFileCapture: boolean;
    maxImageSize: number; // KB
    maxTextSize: number; // 字符数
}
