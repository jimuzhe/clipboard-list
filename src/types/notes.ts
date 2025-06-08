// 笔记接口
export interface Note {
    id: string;
    title: string;
    content: string;
    folderId?: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    isEncrypted: boolean;
    isPinned: boolean;
    wordCount: number;
    readingTime: number; // 预计阅读时间，分钟
}

// 笔记文件夹
export interface NoteFolder {
    id: string;
    name: string;
    parentId?: string; // 支持嵌套文件夹
    color?: string;
    icon?: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    order: number;
}

// 笔记标签
export interface NoteTag {
    id: string;
    name: string;
    color: string;
    description?: string;
    useCount: number; // 使用次数
    createdAt: Date;
}

// 笔记搜索参数
export interface NoteSearchParams {
    query?: string;
    folderId?: string;
    tags?: string[];
    dateRange?: {
        start?: Date;
        end?: Date;
    };
    isPinned?: boolean;
    minWordCount?: number;
    maxWordCount?: number;
}

// 笔记过滤选项
export interface NoteFilter {
    folder: string | 'all';
    tags: string[];
    sortBy: 'createdAt' | 'updatedAt' | 'title' | 'wordCount';
    sortOrder: 'asc' | 'desc';
    showPinned: boolean;
}

// 笔记统计信息
export interface NoteStats {
    totalNotes: number;
    totalWords: number;
    totalFolders: number;
    totalTags: number;
    averageWordCount: number;
    recentlyUpdated: number; // 最近一周更新的笔记数
    oldestNote?: Date;
    newestNote?: Date;
}

// Markdown渲染选项
export interface MarkdownRenderOptions {
    enableSyntaxHighlight: boolean;
    enableMath: boolean;
    enableMermaid: boolean;
    enableToc: boolean; // 目录
    lineNumbers: boolean;
    theme: string;
}

// 笔记导出选项
export interface NoteExportOptions {
    format: 'markdown' | 'html' | 'pdf' | 'docx';
    includeMetadata: boolean;
    includeTags: boolean;
    includeFolder: boolean;
    dateFormat: string;
}

// 笔记导入结果
export interface NoteImportResult {
    success: boolean;
    importedCount: number;
    skippedCount: number;
    errors: string[];
    duplicates: string[];
}
