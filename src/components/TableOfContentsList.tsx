import type {TableOfContentsEntry} from "@lexical/react/LexicalTableOfContentsPlugin";
import {JSX, useEffect, useRef, useState} from "react";
import type {NodeKey} from "lexical";
import {useEditor} from "../editor/EditorProvider.tsx";
import {theme, Tree, TreeDataNode} from 'antd';
import {DownOutlined} from "@ant-design/icons";

const MARGIN_ABOVE_EDITOR = 624;
const HEADING_WIDTH = 9;

function isHeadingAtTheTopOfThePage(element: HTMLElement): boolean {
    const elementYPosition = element?.getClientRects()[0].y;
    return (
        elementYPosition >= MARGIN_ABOVE_EDITOR &&
        elementYPosition <= MARGIN_ABOVE_EDITOR + HEADING_WIDTH
    );
}

function isHeadingAboveViewport(element: HTMLElement): boolean {
    const elementYPosition = element?.getClientRects()[0].y;
    return elementYPosition < MARGIN_ABOVE_EDITOR;
}

function isHeadingBelowTheTopOfThePage(element: HTMLElement): boolean {
    const elementYPosition = element?.getClientRects()[0].y;
    return elementYPosition >= MARGIN_ABOVE_EDITOR + HEADING_WIDTH;
}

function TableOfContentsList({
                                 id,
                                 tableOfContents,
                             }: {
    id: string
    tableOfContents: Array<TableOfContentsEntry>|undefined;
}): JSX.Element {
    const [selectedKey, setSelectedKey] = useState('');
    const [treeData, setTreeData] = useState<TreeDataNode[]>([]);
    const [keys, setKeys] = useState<string[]>([])
    const selectedIndex = useRef(0);
    const editor = useEditor(id);
    const {token: {colorBgContainer}} = theme.useToken();
    function scrollToNode(key: NodeKey, currIndex: number) {
        editor?.getEditorState().read(() => {
            const domElement = editor.getElementByKey(key);
            if (domElement !== null) {
                domElement.scrollIntoView({behavior: 'smooth', block: 'center'});
                setSelectedKey(key);
                selectedIndex.current = currIndex;
            }
        });
    }

    useEffect(() => {
        function scrollCallback() {
            if (
                tableOfContents.length !== 0 &&
                selectedIndex.current < tableOfContents.length - 1
            ) {
                let currentHeading = editor?.getElementByKey(
                    tableOfContents[selectedIndex.current][0],
                );
                if (currentHeading) {
                    if (isHeadingBelowTheTopOfThePage(currentHeading)) {
                        //On natural scroll, user is scrolling up
                        while (
                            currentHeading !== null &&
                            isHeadingBelowTheTopOfThePage(currentHeading) &&
                            selectedIndex.current > 0
                            ) {
                            const prevHeading = editor.getElementByKey(
                                tableOfContents[selectedIndex.current - 1][0],
                            );
                            if (
                                prevHeading !== null &&
                                (isHeadingAboveViewport(prevHeading) ||
                                    isHeadingBelowTheTopOfThePage(prevHeading))
                            ) {
                                selectedIndex.current--;
                            }
                            currentHeading = prevHeading;
                        }
                        const prevHeadingKey = tableOfContents[selectedIndex.current][0];
                        setSelectedKey(prevHeadingKey);
                    } else if (isHeadingAboveViewport(currentHeading)) {
                        //On natural scroll, user is scrolling down
                        while (
                            currentHeading !== null &&
                            isHeadingAboveViewport(currentHeading) &&
                            selectedIndex.current < tableOfContents.length - 1
                            ) {
                            const nextHeading = editor?.getElementByKey(
                                tableOfContents[selectedIndex.current + 1][0],
                            );
                            if (
                                nextHeading !== null &&
                                (isHeadingAtTheTopOfThePage(nextHeading) ||
                                    isHeadingAboveViewport(nextHeading))
                            ) {
                                selectedIndex.current++;
                            }
                            currentHeading = nextHeading;
                        }
                        const nextHeadingKey = tableOfContents[selectedIndex.current][0];
                        setSelectedKey(nextHeadingKey);
                    }
                }
            } else {
                selectedIndex.current = 0;
            }
        }

        let timerId: ReturnType<typeof setTimeout>;

        function debounceFunction(func: () => void, delay: number) {
            clearTimeout(timerId);
            timerId = setTimeout(func, delay);
        }

        function onScroll(): void {
            debounceFunction(scrollCallback, 10);
        }

        const data: TreeDataNode[] = [];
        let currentLevel = {};
        let root = {};
        let current = data;
        const keys:string[] = []
        tableOfContents?.forEach(([key, text, tag], index) => {
            keys.push(key);
                if (index === 0) {
                    const root = {title: text, key, index, tag, children: [], parent: null};
                    current.push(root)
                    currentLevel = root;
                } else {
                    if (tag === currentLevel.tag) {
                        const item = {title: text, key, index, tag, children: [], parent: currentLevel.parent};
                        current.push(item);
                        currentLevel = item;
                    }

                    if (tag < currentLevel.tag) {
                        let cur = currentLevel;
                        while (true) {
                            if (cur.parent) {
                                if (cur.parent.tag === tag) {
                                    if (cur.parent.parent) {
                                        current = cur.parent.parent.children;
                                        currentLevel = cur.parent.parent;
                                    } else {
                                        current = data;
                                        currentLevel = root;
                                    }
                                    break;
                                } else if (cur.parent.tag < tag) {
                                    current = cur.parent.children;
                                    currentLevel = cur.parent;
                                    break;
                                }
                            } else {
                                current = data;
                                currentLevel = cur;
                                break
                            }
                            cur = cur.parent;
                        }
                        const item = {title: text, key, index, tag, children: [], parent: currentLevel};
                        current.push(item);
                        currentLevel = item;
                    }

                    if (tag > currentLevel.tag) {
                        const item = {title: text, key, index, tag, children: [], parent: currentLevel};
                        current = currentLevel.children;
                        current.push(item);
                        currentLevel = item;
                    }
                }
            }
        )
        setKeys(keys);
        setTreeData(data);

        document.addEventListener('scroll', onScroll);
        return () => document.removeEventListener('scroll', onScroll);

    }, [tableOfContents, id]);

    return (
        <div style={{backgroundColor:colorBgContainer, height: '100%'}}>
            <Tree
                showLine
                switcherIcon={<DownOutlined/>}
                expandedKeys={keys}
                onSelect={(_, info) => {
                    scrollToNode(info.node.key, info.node.index);
                }}
                treeData={treeData}
            />
        </div>
    );
}

export default TableOfContentsList;
