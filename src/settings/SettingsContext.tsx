import React, {createContext, ReactNode, useContext} from 'react';

export type SettingsType = {
    colorTheme: string;
    editor: {
        renderWhitespace: string;
        tabSize: number;
        fontSize: number;
    };
    locale: string;
    actionOnStartup: {
        action: number;
        dir: string;
    };
    image: {
        action: number;
        relativeFolderName: string;
        globalDir: string;
        preferRelativeFolder: boolean;
    };
};

const SettingsContext = createContext<SettingsType | undefined>(undefined);

export const useSettings:()=>SettingsType = (): SettingsType => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

interface SettingsProviderProps {
    settings: any;
    children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({settings, children}) => {
    return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
};
