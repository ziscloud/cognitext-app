import {createContext, ReactNode, useContext} from 'react';
import {IFolderTreeNodeProps} from "@dtinsight/molecule/esm/model";

const FileContext = createContext<IFolderTreeNodeProps | undefined>(undefined);

export const useFile = (): IFolderTreeNodeProps => {
    const context = useContext(FileContext);
    if (!context) {
        throw new Error('useFile must be used within a FileProvider');
    }
    return context;
};

interface FileProviderProps {
    file: IFolderTreeNodeProps;
    children: ReactNode;
}

export const FileProvider: React.FC<FileProviderProps> = ({file, children}) => {
    return <FileContext.Provider value={file}>{children}</FileContext.Provider>;
};
