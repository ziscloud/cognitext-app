import React, {useEffect} from 'react';
import {FolderOutlined, PlusOutlined} from '@ant-design/icons';
import {Button, Flex, Layout, Menu, MenuProps, theme} from 'antd';
import {SettingsType, useSettings} from "../settings/SettingsContext.tsx";
import {DirEntry, readDir} from "@tauri-apps/plugin-fs";
import {join} from '@tauri-apps/api/path';
import crypto from "crypto-js";
import {PiFileMdFill} from "react-icons/pi";
import DebounceSelect from "./DebounceSelect.tsx";

const {Header} = Layout;
type MenuItem = Required<MenuProps>['items'][number];

async function processEntriesRecursively(parentPath: string, entries: DirEntry[], parent?: EntryItem) {
    const items: MenuItem[] = [];
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
            const children = await processEntriesRecursively(path, await readDir(path), item);
            //将children的names添加到当前的names中
            for (const [k, v] of children.names) {
                names.set(k, v);
            }
            items.push({
                key: key,
                label: entry.name,
                icon: <FolderOutlined/>,
                children: children.items,
            })
        } else {
            items.push({
                key: key,
                label: entry.name,
                icon: <PiFileMdFill/>,
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
            return a.label.localeCompare(b.label);
        });
    }

    return {items, names};
}

async function loadDir(dir: string) {
    const entries: DirEntry[] = await readDir(dir);
    return await processEntriesRecursively(dir, entries);
}

interface FolderTreeProps {
    onFileSelect: (key: string, path: string, fileName?: string) => void
}

export type EntryItem = { entry: DirEntry, parent?: EntryItem }

const FolderTree: React.FC<FolderTreeProps> = ({onFileSelect}: FolderTreeProps) => {
    const settings: SettingsType = useSettings();
    const [items, setItems] = React.useState<{ items: MenuItem[], names: Map<string, EntryItem> }>();
    const {
        token: {colorBgContainer, colorSplit},
    } = theme.useToken();

    const onClick: MenuProps['onClick'] = (value) => {
        let path;
        let fileName;
        const {key, keyPath} = value;
        //event from menu item click
        if (keyPath) {
            const names = keyPath.map(k => {
                return items?.names.get(k)?.entry.name
            });
            fileName = items?.names?.get(key)?.entry.name;
            path = settings.actionOnStartup?.dir + "/" + names.reverse().join('/');
            onFileSelect(key, path, fileName);
        } else {
            //event from search
            const parents: string[] = [];
            //@ts-ignore
            let currentItem: EntryItem | undefined = items?.names?.get(value);
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
        }
    };

    useEffect(() => {
        if (settings.actionOnStartup?.action === 1 && settings.actionOnStartup?.dir) {
            const rootPath = settings.actionOnStartup?.dir;
            loadDir(rootPath).then(value => {
                    setItems(value);
                }
            )
        }
    }, [settings]);

    return (
        <Flex vertical={true} style={{height: '100%', width: '100%'}}>
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
                  style={{flexGrow: 3, overflowY: 'auto', width: '100%', backgroundColor: colorBgContainer}}>
                <Menu
                    onClick={onClick}
                    style={{width: '100%'}}
                    defaultSelectedKeys={['1']}
                    defaultOpenKeys={['sub1']}
                    mode="inline"
                    items={items?.items || []}
                />
            </Flex>
        </Flex>
    );
};

export default FolderTree;
