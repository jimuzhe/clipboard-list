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
    readingTime: number;
}
export interface NoteFolder {
    id: string;
    name: string;
    parentId?: string;
    color?: string;
    icon?: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    order: number;
}
export interface NoteTag {
    id: string;
    name: string;
    color: string;
    description?: string;
    useCount: number;
    createdAt: Date;
}
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
export interface NoteFilter {
    folder: string | 'all';
    tags: string[];
    sortBy: 'createdAt' | 'updatedAt' | 'title' | 'wordCount';
    sortOrder: 'asc' | 'desc';
    showPinned: boolean;
}
export interface NoteStats {
    totalNotes: number;
    totalWords: number;
    totalFolders: number;
    totalTags: number;
    averageWordCount: number;
    recentlyUpdated: number;
    oldestNote?: Date;
    newestNote?: Date;
}
export interface MarkdownRenderOptions {
    enableSyntaxHighlight: boolean;
    enableMath: boolean;
    enableMermaid: boolean;
    enableToc: boolean;
    lineNumbers: boolean;
    theme: string;
}
export interface NoteExportOptions {
    format: 'markdown' | 'html' | 'pdf' | 'docx';
    includeMetadata: boolean;
    includeTags: boolean;
    includeFolder: boolean;
    dateFormat: string;
}
export interface NoteImportResult {
    success: boolean;
    importedCount: number;
    skippedCount: number;
    errors: string[];
    duplicates: string[];
}
//# sourceMappingURL=notes.d.ts.map