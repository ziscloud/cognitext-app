import React, {useEffect} from 'react';
import {FolderOutlined} from '@ant-design/icons';
import type {MenuProps} from 'antd';
import {Menu} from 'antd';
import {SettingsType, useSettings} from "./settings/SettingsContext.tsx";
import {DirEntry, readDir} from "@tauri-apps/plugin-fs";
import {join} from '@tauri-apps/api/path';
import crypto from "crypto-js";
import {PiFileMdFill} from "react-icons/pi";

type MenuItem = Required<MenuProps>['items'][number];

async function processEntriesRecursively(parent: string, entries: DirEntry[]) {
    const items: MenuItem[] = [];
    const names = new Map<string, string>();
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
        const path = await join(parent, entry.name);
        const key = crypto.MD5(path).toString(crypto.enc.Hex);

        names.set(key, entry.name);

        if (entry.isDirectory) {
            const children = await processEntriesRecursively(path, await readDir(path));
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

const FolderTree: React.FC<FolderTreeProps> = ({onFileSelect}: FolderTreeProps) => {
    const settings: SettingsType = useSettings();
    const [items, setItems] = React.useState<{ items: MenuItem[], names: Map<string, string> }>();
    const onClick: MenuProps['onClick'] = ({key, keyPath}) => {
        const names = keyPath.map(k => {
            return items?.names.get(k)
        });
        const path = names.reverse().join('/');
        onFileSelect(key, settings.actionOnStartup?.dir + "/" + path, items?.names?.get(key));
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
        <Menu
            onClick={onClick}
            style={{width: '100%'}}
            defaultSelectedKeys={['1']}
            defaultOpenKeys={['sub1']}
            mode="inline"
            items={items?.items || []}
        />
    );
};

export default FolderTree;
