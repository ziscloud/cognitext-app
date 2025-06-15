// SearchPlugin.tsx
import {
    $getRoot,
    $getSelection,
    $isRangeSelection,
    $isTextNode,
    COMMAND_PRIORITY_LOW,
    COMMAND_PRIORITY_NORMAL,
    createCommand,
    LexicalCommand,
    SELECTION_CHANGE_COMMAND,
    TextNode,
} from 'lexical';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {useCallback, useEffect, useRef, useState} from 'react';
import {mergeRegister} from '@lexical/utils';
import {Button, Flex, Input, InputRef} from "antd";
import {ArrowDownOutlined, ArrowUpOutlined, CloseOutlined} from "@ant-design/icons";

// Define a custom command to open the search bar
export const OPEN_SEARCH_COMMAND: LexicalCommand<void> = createCommand();

interface SearchResult {
    node: TextNode;
    offset: number;
    length: number;
}

export function FindAndReplacePlugin() {
    const [editor] = useLexicalComposerContext();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

    const searchInputRef = useRef<InputRef>(null);

    // 1. Register the Ctrl+F command
    useEffect(() => {
        return mergeRegister(
            editor.registerCommand(
                OPEN_SEARCH_COMMAND,
                () => {
                    console.log('Opening search', isSearchOpen)
                    setIsSearchOpen((prev) => !prev);
                    // Focus the search input when it opens
                    if (isSearchOpen && searchInputRef.current) {
                        setTimeout(() => searchInputRef.current?.focus(), 0);
                    }
                    return true; // Mark as handled
                },
                COMMAND_PRIORITY_NORMAL
            ),
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    // You might want to clear highlights or update the current match
                    // when the selection changes, depending on your desired UX.
                    return false;
                },
                COMMAND_PRIORITY_LOW
            ),
        );
    }, [editor]);

    // 2. Search logic
    const performSearch = useCallback(() => {
        if (!searchTerm) {
            setSearchResults([]);
            setCurrentMatchIndex(-1);
            return;
        }

        editor.update(() => {
            const root = $getRoot();
            const matches: SearchResult[] = [];
            const regex = new RegExp(searchTerm, 'gi'); // Case-insensitive global search

            // Find the node that contains this match

            // console.log('Searching for', match, match.index, match![0].length, currentOffset)
            root.getAllTextNodes().forEach((node) => {
                if ($isTextNode(node)) {
                    let match;
                    let currentOffset = 0;

                    const nodeText = node.getTextContent();
                    while ((match = regex.exec(nodeText)) !== null) {
                        if (
                            match!.index >= currentOffset &&
                            match!.index < currentOffset + nodeText.length
                        ) {
                            console.log('Found match', match, match.index, match![0].length, currentOffset, nodeText)
                            matches.push({
                                node: node,
                                offset: match!.index - currentOffset,
                                length: match![0].length,
                            });
                            regex.lastIndex = match!.index + match![0].length; // Continue search from after this match
                        } else {
                            console.log('Skipping match', nodeText, nodeText.length, currentOffset)
                        }
                        currentOffset += nodeText.length;
                    }
                }
            });

            setSearchResults(matches);
            setCurrentMatchIndex(matches.length > 0 ? 0 : -1);

            // Optionally, highlight matches here using Node Transforms or by setting a specific format
            // For a simple highlight:
            // You'd need a custom node or a specific text format to apply
            // For more advanced highlighting (like unique IDs for each match), you'd need custom nodes
            // and a Node Transform.
        });
    }, [editor, searchTerm]);

    // 3. Navigation between results
    const navigateToMatch = useCallback(
        (direction: 'next' | 'prev') => {
            if (searchResults.length === 0) return;

            let newIndex = currentMatchIndex;
            if (direction === 'next') {
                newIndex = (currentMatchIndex + 1) % searchResults.length;
            } else {
                newIndex =
                    (currentMatchIndex - 1 + searchResults.length) % searchResults.length;
            }

            setCurrentMatchIndex(newIndex);

            const match = searchResults[newIndex];
            if (match) {
                editor.update(() => {
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                        // Select the found text
                        selection.setTextNodeRange(
                            match.node,
                            match.offset,
                            match.node,
                            match.offset + match.length
                        );
                        // Scroll into view
                        editor.getElementByKey(match.node.getKey())?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                            inline: "nearest"
                        });
                    }
                });
            }
        },
        [editor, searchResults, currentMatchIndex]
    );

    useEffect(() => {
        performSearch();
    }, [searchTerm, performSearch]); // Re-run search when search term changes

    return (
        <>
            {isSearchOpen && (
                <Flex className={'find-bar'} gap={'small'} align={'center'}>
                    <Input
                        ref={searchInputRef}
                        autoFocus={true}
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                navigateToMatch('next');
                            } else if (e.key === 'Escape') {
                                setIsSearchOpen(false);
                                setSearchTerm('');
                                setSearchResults([]);
                                setCurrentMatchIndex(-1);
                            }
                        }}
                    />
                    <Button type={'text'} style={{minWidth: '32px'}} onClick={() => navigateToMatch('prev')}
                            icon={<ArrowUpOutlined/>}/>
                    <Button type={'text'} style={{minWidth: '32px'}} onClick={() => navigateToMatch('next')}
                            icon={<ArrowDownOutlined/>}/>
                    <Button color="default" variant={'text'}>
                        {searchResults.length > 0 ? `${currentMatchIndex + 1} / ${searchResults.length}` : '0 / 0'}
                    </Button>
                    <Button type={'text'} style={{minWidth: '32px'}} onClick={() => setIsSearchOpen(false)}
                            icon={<CloseOutlined/>}/>
                </Flex>
            )}
        </>
    );
}
