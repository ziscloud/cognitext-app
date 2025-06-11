import {useEffect, useState} from 'react';
import {SearchBar} from './SearchBar.tsx';
import {SearchableDocument, SearchService} from '../services/search/SearchService';
import {useSettings} from "../settings/SettingsContext.tsx";
import {Spin, theme} from "antd";
import {LoadingOutlined} from "@ant-design/icons";

const searchService = new SearchService();

interface FullTextSearchProps {
    onDocumentSelect: (document: SearchableDocument) => void;
}

const FullTextSearch: React.FC<FullTextSearchProps> = ({onDocumentSelect}) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const settings = useSettings();
    const {token: {colorBgContainer}} = theme.useToken();
    useEffect(() => {
        const initializeSearch = async () => {
            try {
                if (settings) {
                    if (settings.actionOnStartup?.dir) {
                        setIsInitialized(false);
                        searchService.indexDirectory(settings.actionOnStartup?.dir).then(
                            () => {
                                console.log('Search index initialized');
                                setIsInitialized(true);
                            }
                        ).catch((error) => {
                            console.error('Failed to initialize search:', error);
                            setIsInitialized(true);
                        })
                    }
                }
            } catch (error) {
                console.error('Failed to initialize search:', error);
                setIsInitialized(true);
            }
        };

        initializeSearch();
    }, []);

    if (!isInitialized) {
        return (
            <div style={{padding: '4px', height: '100%', backgroundColor: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <Spin indicator={<LoadingOutlined spin/>} size="large" tip='Indexing...'/>
            </div>
        );
    }

    return (
        <div style={{padding: '4px', height: '100%', backgroundColor: colorBgContainer}}>
            <SearchBar
                searchService={searchService}
                onDocumentSelect={onDocumentSelect}
            />
        </div>
    );
}

export default FullTextSearch;
