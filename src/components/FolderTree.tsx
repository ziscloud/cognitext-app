import React, {useEffect, useRef, useState} from 'react';
import {FolderOutlined, PlusOutlined} from '@ant-design/icons';
import {Button, Flex, GetProps, Layout, Menu, Skeleton, theme, Tree, TreeDataNode} from 'antd';
import {SettingsType, useSettings} from "../settings/SettingsContext.tsx";
import {DirEntry, readDir} from "@tauri-apps/plugin-fs";
import {join} from '@tauri-apps/api/path';
import crypto from "crypto-js";
import DebounceSelect from "./DebounceSelect.tsx";
import {useEvent} from "../event/EventContext.tsx";
import {EventType} from "../event/event.ts";
import {PiFileMdFill} from "react-icons/pi";
import TreeTitle from "./TreeTitle.tsx";
import {revealItemInDir} from "@tauri-apps/plugin-opener";
import {MenuInfo} from "rc-menu/lib/interface";
import {toValue} from "./react-split-pane-next/utils.ts";

type DirectoryTreeProps = GetProps<typeof Tree.DirectoryTree>;

const {Header} = Layout;
const menuWidth = 200; // Estimated menu width
const menuHeight = 150; // Estimated menu height

type TreeNode = TreeDataNode & { level: number };

async function processEntriesRecursively(parentPath: string, entries: DirEntry[], level: number, parent?: EntryItem) {
    const items: TreeNode[] = [];
    const names = new Map<string, EntryItem>();
    for (const entry of entries) {
        if (entry.name.startsWith(".")) {
            continue;
        }
        if (entry.name.includes('.assets')) {
            continue;
        }
        if (entry.name === 'assets') {
            continue;
        }
        const path = await join(parentPath, entry.name);
        const key = crypto.MD5(path).toString(crypto.enc.Hex);

        const item = {entry, parent, key};
        names.set(key, item);

        if (entry.isDirectory) {
            const children = await processEntriesRecursively(path, await readDir(path), level + 1, item);
            //将children的names添加到当前的names中
            for (const [k, v] of children.names) {
                names.set(k, v);
            }
            items.push({
                key: key,
                icon: <FolderOutlined/>,
                title: entry.name,
                children: children.items,
                level: level,
            })
        } else {
            items.push({
                key: key,
                title: entry.name,
                icon: <PiFileMdFill/>,
                isLeaf: true,
                level: level,
            })
        }
        //对items进行排序，有children的排在顶部，无children的排在底部，有无children的排序都是按照label的字母顺序排序
        items.sort((a, b) => {
            //@ts-ignore
            if (a.children && !b.children) {
                return -1;
            }
            //@ts-ignore
            if (!a.children && b.children) {
                return 1;
            }
            //@ts-ignore
            return a.title.localeCompare(b.title);
        });
    }

    return {items, names};
}

async function loadDir(dir: string) {
    const entries: DirEntry[] = await readDir(dir);
    return await processEntriesRecursively(dir, entries, 1);
}

interface FolderTreeProps {
    onFileSelect: (key: string, path: string, fileName?: string) => void,
    width: string
}

export type EntryItem = { entry: DirEntry, parent?: EntryItem , key:string}

const FolderTree: React.FC<FolderTreeProps> = ({onFileSelect, width}: FolderTreeProps) => {
    const settings: SettingsType = useSettings();
    const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
    const [expandKeys, setExpandKeys] = useState<React.Key[]>([]);
    const [items, setItems] = useState<{ items: TreeNode[], names: Map<string, EntryItem> }>();
    const [loading, setLoading] = useState(false);
    const [contextMenu, setContextMenu] = useState<{
        visible: boolean,
        x: number,
        y: number,
        node: TreeDataNode | null,
    }>({
        visible: false,
        x: 0,
        y: 0,
        node: null,
    });

    const contextMenuRef = useRef(null);
    const treeRef = useRef(null);
    const itemsRef = useRef(items);
    const {token: {colorBgContainer, colorSplit}} = theme.useToken();
    const {subscribe} = useEvent();
    const onClick: DirectoryTreeProps["onSelect"] = (value) => {
        let path;
        let fileName;
        //event from search
        const parents: string[] = [];
        //@ts-ignore
        let currentItem: EntryItem | undefined = items?.names?.get(Array.isArray(value) ? value[0] : value);
        if (currentItem?.entry.isDirectory) {
            return;
        }
        fileName = currentItem?.entry.name;
        while (currentItem) {
            if (currentItem.parent) {
                parents.push(currentItem.parent.entry.name);
                currentItem = currentItem.parent;
            } else {
                break;
            }
        }
        path = settings.actionOnStartup?.dir + "/" + parents.reverse().join('/') + "/" + fileName;
        //@ts-ignore
        onFileSelect(value, path, fileName);
    };

    useEffect(() => {
        if (settings.actionOnStartup?.action === 1 && settings.actionOnStartup?.dir) {
            const rootPath = settings.actionOnStartup?.dir;
            setLoading(true);
            loadDir(rootPath).then(value => {
                setItems(value);
                setLoading(false);
            });
        }
    }, [settings]);

    useEffect(() => {
        subscribe(EventType.FILE_SAVED, async ({file}) => {
            if (file.isNew) {
                if (settings.actionOnStartup?.action === 1 && settings.actionOnStartup?.dir) {
                    const rootPath = settings.actionOnStartup?.dir;
                    setLoading(true);
                    loadDir(rootPath).then(value => {
                        setItems(value);
                        setLoading(false);
                    });
                }
            }
        })
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (_: MouseEvent) => {
            if (contextMenuRef.current) {
                setContextMenu({...contextMenu, visible: false});
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [contextMenu]);

    const handleMenuAction = (e: MenuInfo) => {
        console.log('Action:', e.key, 'on node:', contextMenu.node);
        if (e.key === 'reveal') {
            const value = contextMenu.node?.key;
            let currentItem: EntryItem | undefined = items?.names?.get(value?.toString() || '');
            const fileName = currentItem?.entry.name;
            const parents: string[] = [];
            while (currentItem) {
                if (currentItem.parent) {
                    parents.push(currentItem.parent.entry.name);
                    currentItem = currentItem.parent;
                } else {
                    break;
                }
            }
            const path = settings.actionOnStartup?.dir + "/" + parents.reverse().join('/') + "/" + fileName;
            revealItemInDir(path);
        }
        setContextMenu({...contextMenu, visible: false}); // Close menu
    };

    // const cb = (event: any) => {
    //     console.log('got event', event)
    //     //TODO shunyun 2025/6/6: 排除自己出发的事件
    //     // setLoading(true);
    //     // loadDir(settings.actionOnStartup?.dir).then(value => {
    //     //     setItems(value);
    //     //     setLoading(false);
    //     // });
    // };

    useEffect(() => {
        // let unwatch: UnwatchFn;
        //
        // if (settings.actionOnStartup?.dir) {
        //     watch(settings.actionOnStartup.dir, cb, {delayMs: 1000, recursive: true})
        //         .then((uw) => {
        //             unwatch = uw;
        //             console.log("Watching file", settings.actionOnStartup.dir);
        //         })
        //         .catch((e) => console.log("Error", e));
        // }
        //
        // return () => {
        //     if (unwatch) {
        //         unwatch();
        //         console.log("Stopped watching file");
        //     }
        // };
    }, [settings]);


    useEffect(() => {
        return subscribe(EventType.FILE_ACTIVE, ({id}) => {
            console.log('FILE_ACTIVE', id)
            if (id) {
                const key = id.substring(4);
                const openKeys:string[] = [];
                const item = itemsRef.current?.names?.get(key);
                let parent = item?.parent;
                while (parent) {
                    openKeys.push(parent?.key)
                    parent = parent.parent;
                }
                setExpandKeys(prevState => [...prevState, ...openKeys]);
                setSelectedKeys([key])
                if (treeRef.current) {
                    const treeElement:HTMLElement = treeRef.current;
                    if (treeElement) {
                        const nodeElement = treeElement.querySelector(`[title="${item?.entry.name}"]`);
                        if (nodeElement) {
                            // Use the native DOM scrollIntoView method
                            nodeElement.scrollIntoView({
                                behavior: 'smooth', // Optional: for smooth scrolling
                                block: 'nearest',   // Optional: 'start', 'center', 'end', or 'nearest'
                                inline: 'start'   // Optional: 'start', 'center', 'end', or 'nearest'
                            });
                        }
                    }
                }
            } else {
                setSelectedKeys([])
            }
        });
    }, [subscribe]);

    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    return (
        <Flex vertical={true} style={{height: '100%', width: width, overflow: 'hidden'}}>
            <Header style={{
                margin: 0,
                padding: 0,
                width: '100%',
                maxWidth: '100%',
                height: '46px',
                background: colorBgContainer,
                borderBottom: `1px solid ${colorSplit}`
            }}>
                <Flex className={'left-panel-header-container'} justify={'space-between'} gap={'small'} align={'center'}>
                    <Flex id={'left-panel-header-search-container'} flex={1}>
                        <DebounceSelect
                            placeholder="search file name"
                            dataSource={items?.names}
                            //@ts-ignore
                            onSelect={onClick}
                        />
                    </Flex>
                    <Button icon={<PlusOutlined/>}/>
                </Flex>
            </Header>
            <Flex id={'left-panel'}
                  style={{
                      flexGrow: 3,
                      overflowX: 'hidden',
                      width: width,
                      backgroundColor: colorBgContainer
                  }}>
                {loading && <Skeleton active={true}/>}
                {!loading &&
                    <div style={{ height: '100%', width: width, overflowY: 'auto'}} ref={treeRef}>
                        <Tree.DirectoryTree
                            style={{
                                width: toValue(width) - 15,
                                overflowX: 'hidden',
                            }}
                            draggable={{icon: false, nodeDraggable: () => true}}
                            titleRender={(nodeData) => {
                                return <TreeTitle nodeData={nodeData} width={width}/>
                            }}
                            onExpand={(expandedKeys, _) => {
                                    setExpandKeys(expandedKeys);
                            }}
                            expandedKeys={expandKeys}
                            selectedKeys={selectedKeys}
                            onSelect={onClick}
                            onDrop={({event, node, dragNode, dragNodesKeys}) => {
                                console.log('on drop ', event, node, dragNode, dragNodesKeys)
                            }}
                            treeData={items?.items || []}
                            onRightClick={({event, node}) => {
                                event.preventDefault();

                                // Get viewport dimensions
                                const viewportWidth = window.innerWidth;
                                const viewportHeight = window.innerHeight;

                                // Calculate adjusted position
                                let adjustedX = event.clientX;
                                let adjustedY = event.clientY;

                                // Adjust for right edge
                                if (event.clientX + menuWidth > viewportWidth) {
                                    adjustedX = event.clientX - menuWidth;
                                }

                                // Adjust for bottom edge
                                if (event.clientY + menuHeight > viewportHeight) {
                                    adjustedY = event.clientY - menuHeight;
                                }

                                setContextMenu({
                                    visible: true,
                                    x: adjustedX,
                                    y: adjustedY,
                                    node: node,
                                });
                            }}
                        />
                        {contextMenu.visible && (
                            <div
                                ref={contextMenuRef}
                                style={{
                                    position: 'fixed',
                                    left: contextMenu.x,
                                    top: contextMenu.y,
                                    zIndex: 1000,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                }}
                            >
                                <Menu onClick={handleMenuAction}>
                                    <Menu.Item key="reveal">Reveal In Finder</Menu.Item>
                                    <Menu.Item key="copy">Copy</Menu.Item>
                                    <Menu.Item key="rename">Rename</Menu.Item>
                                    <Menu.Item key="delete" danger>Delete</Menu.Item>
                                </Menu>
                            </div>
                        )}
                    </div>
                }
            </Flex>
        </Flex>
    );
};

export default React.memo(FolderTree);
