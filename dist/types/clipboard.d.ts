export interface ClipboardItem {
    id: string;
    content: string;
    type: ClipboardItemType;
    subType?: string;
    size: number;
    timestamp: Date;
    isPinned: boolean;
    tags: string[];
    preview?: string;
    source?: string;
}
export type ClipboardItemType = 'text' | 'image' | 'file' | 'code' | 'url' | 'email';
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
export interface ClipboardFilter {
    type: ClipboardItemType | 'all';
    timeRange: 'today' | 'week' | 'month' | 'all';
    showPinned: boolean;
}
export interface CodeDetectionResult {
    language: string;
    confidence: number;
    features: string[];
}
export interface ClipboardMonitorConfig {
    interval: number;
    enableImageCapture: boolean;
    enableFileCapture: boolean;
    maxImageSize: number;
    maxTextSize: number;
}
//# sourceMappingURL=clipboard.d.ts.map