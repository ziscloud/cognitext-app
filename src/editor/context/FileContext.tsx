import {createContext, ReactNode, useContext} from 'react';

export type EditorTabFile = {
    tabId: string;
    groupId: string;
    treeNodeId: string;
    value: string;
    language: string
};

const FileContext = createContext<EditorTabFile | undefined>(undefined);

export const useFile = (): EditorTabFile => {
    const context = useContext(FileContext);
    if (!context) {
        throw new Error('useFile must be used within a FileProvider');
    }
    return context;
};

interface FileProviderProps {
    file: EditorTabFile;
    children: ReactNode;
}

export const FileProvider: React.FC<FileProviderProps> = ({file, children}) => {
    return <FileContext.Provider value={file}>{children}</FileContext.Provider>;
};
