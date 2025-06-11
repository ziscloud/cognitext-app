import React, {useEffect, useState} from 'react';
import {Button, Input, List, Space, Typography} from 'antd';
import {SettingOutlined} from '@ant-design/icons';
import {SearchableDocument, SearchService} from '../services/search/SearchService';
import {CustomScroll} from "react-custom-scroll";

const {Text} = Typography;

interface SearchBarProps {
    searchService: SearchService;
    onDocumentSelect: (document: SearchableDocument) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({searchService, onDocumentSelect}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchableDocument[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const searchTimeout = setTimeout(async () => {
            if (searchQuery.trim()) {
                setIsSearching(true);
                try {
                    const results = await searchService.search(searchQuery);
                    setSearchResults(results);
                } catch (error) {
                    console.error('Search error:', error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(searchTimeout);
    }, [searchQuery, searchService]);

    return (
        <div style={{width: '100%', height: '100%', margin: '0 auto'}}>
            <Space.Compact style={{width: '100%'}}>
                <Input
                    allowClear
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{marginBottom: 16}}
                />
                <Button icon={<SettingOutlined/>}/>
            </Space.Compact>

            {searchResults.length > 0 && (
                <CustomScroll heightRelativeToParent={'100%'}>
                    <List
                        dataSource={searchResults}
                        renderItem={(doc: SearchableDocument) => (
                            <List.Item
                                onClick={() => onDocumentSelect(doc)}
                                style={{cursor: 'pointer'}}
                            >
                                <div>
                                    <Text strong>{doc.title}</Text>
                                    <br/>
                                    <Typography.Paragraph ellipsis={{rows: 2}}>
                                        {doc.content.substring(0, 150)}...
                                    </Typography.Paragraph>
                                </div>
                            </List.Item>
                        )}
                    />
                </CustomScroll>
            )}

            {isSearching && <Text type="secondary">Searching...</Text>}
        </div>
    );
};
