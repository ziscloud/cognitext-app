// types/event.ts
import {EditorTabFile} from "../editor/context/FileContext.tsx";
import type {TableOfContentsEntry} from "@lexical/react/LexicalTableOfContentsPlugin";

export enum EventType {
    FILE_SAVED = 'file/saved',
    FILE_TOC = 'file/toc',
    SAVE_FILE = 'file/save',
    FILE_CHANGED = 'file/changed',
    SAVE = 'menu/save',
    NEW_FILE = 'file/new',
    DATA_UPDATED = 'data/updated',
    THEME_CHANGED = 'theme/changed',
}

// 定义事件参数类型映射
export interface EventMap {
    [EventType.FILE_SAVED]: { file: EditorTabFile; path?: string, content?: string };
    [EventType.SAVE]: {};
    [EventType.FILE_TOC]: {id: string, toc:Array<TableOfContentsEntry>};
    [EventType.FILE_CHANGED]: {tabId: string};
    [EventType.NEW_FILE]: {};
    [EventType.SAVE_FILE]: {path?:string};
    [EventType.DATA_UPDATED]: { id: number; value: string };
    [EventType.THEME_CHANGED]: { theme: 'light' | 'dark' };
}
