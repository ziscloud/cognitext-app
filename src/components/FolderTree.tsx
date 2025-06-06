import React, {useEffect, useState} from 'react';
import {FolderOutlined, PlusOutlined} from '@ant-design/icons';
import type {GetProps, TreeDataNode} from 'antd';
import {Button, Flex, Layout, Skeleton, theme, Tree} from 'antd';
import {SettingsType, useSettings} from "../settings/SettingsContext.tsx";
import {DirEntry, readDir} from "@tauri-apps/plugin-fs";
import {join} from '@tauri-apps/api/path';
import crypto from "crypto-js";
import DebounceSelect from "./DebounceSelect.tsx";
import {useEvent} from "../event/EventContext.tsx";
import {EventType} from "../event/event.ts";
import {PiFileMdFill} from "react-icons/pi";
import TreeTitle from "./TreeTitle.tsx";

type DirectoryTreeProps = GetProps<typeof Tree.DirectoryTree>;

const {DirectoryTree} = Tree;
const {Header} = Layout;

async function processEntriesRecursively(parentPath: string, entries: DirEntry[], level:number, parent?: EntryItem) {
    const items: TreeDataNode[] = [];
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

        const item = {entry, parent};
        names.set(key, item);

        if (entry.isDirectory) {
            const children = await processEntriesRecursively(path, await readDir(path), level+1, item);
            //将children的names添加到当前的names中
            for (const [k, v] of children.names) {
                names.set(k, v);
            }
            items.push({
                key: key,
                icon: <FolderOutlined/>,
                title: entry.name,
                children: children.items,
                level:level,
            })
        } else {
            items.push({
                key: key,
                title: entry.name,
                icon: <PiFileMdFill/>,
                isLeaf: true,
                level:level,
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
    width: number
}

export type EntryItem = { entry: DirEntry, parent?: EntryItem }

const FolderTree: React.FC<FolderTreeProps> = ({onFileSelect, width}: FolderTreeProps) => {
    const settings: SettingsType = useSettings();
    const [items, setItems] = useState<{ items: TreeDataNode[], names: Map<string, EntryItem> }>();
    const [loading, setLoading] = useState(false);
    const {token: {colorBgContainer, colorSplit}} = theme.useToken();
    const {subscribe} = useEvent();
    const onClick: DirectoryTreeProps["onSelect"] = (value) => {
        let path;
        let fileName;
        //event from search
        const parents: string[] = [];
        //@ts-ignore
        let currentItem: EntryItem | undefined = items?.names?.get(Array.isArray(value) ? value[0] : value);
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
                <Flex className={'left-panel-header-container'} justify={'space-between'} gap={'small'} align={'center'}
                      style={{width: '100%', padding: '0 24px'}}>
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
                  style={{flexGrow: 3, overflowY: 'auto', overflowX: 'hidden', width: width, backgroundColor: colorBgContainer}}>
                {loading && <Skeleton active={true}/>}
                {!loading &&
                    <Tree.DirectoryTree
                        style={{
                            width:width,
                            overflowX: 'hidden',
                        }}
                        // showIcon={false}
                        // showLine={true}
                        draggable={{icon: false, nodeDraggable: () => true}}
                        titleRender={(nodeData:DateNode)=>{
                            // console.log(nodeData.title, nodeData.level)
                            return <TreeTitle nodeData={nodeData} width={width}/>}
                        }
                        onSelect={onClick}
                        onDrop={({event, node, dragNode, dragNodesKeys}) => {
                            console.log('on drop ', event, node, dragNode, dragNodesKeys)
                        }}
                        // onExpand={onExpand}
                        treeData={items?.items || []}
                    />
                }
            </Flex>
        </Flex>
    );
};

export default React.memo(FolderTree);
