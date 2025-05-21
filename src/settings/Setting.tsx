import React, {useEffect, useState} from 'react';
import {ConfigProvider, Flex, GetProps, Input, Menu, MenuProps, Splitter, Typography} from 'antd';
import {FileImageOutlined, ProductOutlined, SettingOutlined} from '@ant-design/icons';
import {Route, Routes, useNavigate} from "react-router";
import './Setting.css'
import ActionOnStartup from "./ActionOnStartup.tsx";
import {BaseDirectory, exists, readTextFile} from '@tauri-apps/plugin-fs';
import {SETTINGS_FILE} from "../common/consts.ts";
import ImageSettings from "./ImageSettings.tsx";
import LanguageSettings from "./LanguageSettings.tsx";
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';

type SearchProps = GetProps<typeof Input.Search>;

const {Search} = Input;
const onSearch: SearchProps['onSearch'] = (value, _e, info) => console.log(info?.source, value);

type MenuItem = Required<MenuProps>['items'][number];

const items: MenuItem[] = [
    {
        key: 'generalGroup',
        label: 'General',
        type: 'group',
        children: [
            {
                key: 'general',
                label: 'General',
                icon: <ProductOutlined/>,
            },
            {
                key: 'image',
                label: 'Image',
                icon: <FileImageOutlined/>,
            },
            {
                type: 'divider',
            },
            {
                key: 'keymap',
                label: 'Key Map',
                icon: <SettingOutlined/>,
            },
        ],

    },

    {
        key: 'themeGroup',
        label: 'Theme',
        type: 'group',
        children: [
            {key: 'editor-theme', label: 'Editor'},
            {key: 'application-theme', label: 'Application'},
        ],
    },
];

interface HomeProps {
    settings?: any
}

function GeneralSettingsSection({settings}: HomeProps) {

    return (
        <Flex justify="flex-start" align="start" style={{height: '100%', padding: '0 16px',}} vertical>
            <Typography.Title type="secondary" level={3} style={{whiteSpace: 'nowrap'}}>
                General
            </Typography.Title>
            <ActionOnStartup settings={settings}/>
            <LanguageSettings settings={settings}/>
        </Flex>
    );
}

function ImageSettingsSection({settings}: HomeProps) {

    return (
        <Flex justify="flex-start" align="start" style={{height: '100%', padding: '0 16px',}} vertical>
            <Typography.Title type="secondary" level={3} style={{whiteSpace: 'nowrap'}}>
                Image
            </Typography.Title>
            <ImageSettings settings={settings}/>
        </Flex>
    );
}

function KeyMapSettingsSection() {
    return <h2>KeyMap</h2>;
}

const Desc: React.FC<Readonly<{ text?: string | number }>> = (props) => {
    const navigate = useNavigate();
    //@ts-ignore
    const onClick: MenuProps['onClick'] = ({item, key, keyPath, domEvent}) => {
        navigate('/' + key)
    };

    return (
        <Flex justify="flex-start" align="center" style={{height: '100%', overflowX: 'hidden'}} vertical>
            <Typography.Title type="secondary" level={5} style={{whiteSpace: 'nowrap'}}>
                {props.text}
            </Typography.Title>
            <Search onSearch={onSearch}/>
            <Menu
                onClick={onClick}
                style={{width: 256}}
                defaultSelectedKeys={['1']}
                defaultOpenKeys={['sub1']}
                mode="inline"
                items={items}
            />
        </Flex>
    )
};

const Setting: React.FC = () => {
    const [settings, setSettings] = useState()
    const navigate = useNavigate();
    const loadSettings = async () => {
        if (await exists(SETTINGS_FILE, {baseDir: BaseDirectory.AppConfig,})) {
            const settingsJson = await readTextFile(SETTINGS_FILE, {
                baseDir: BaseDirectory.AppConfig,
            });
            return JSON.parse(settingsJson);
        }
        return {};
    }


    useEffect(() => {
        loadSettings().then(settings => {
            setSettings(settings);
            navigate('/general')
        })
    }, [])

    return (
        //@ts-ignore
        <ConfigProvider locale={settings?.locale === 'zh-CN' ? zhCN : enUS}>
            <Splitter style={{height: '100%'}}>
                <Splitter.Panel defaultSize="30%" min="30%" max="50%">
                    <Desc text="Preferences"/>
                </Splitter.Panel>
                <Splitter.Panel>

                    <Routes>
                        <Route index path="/general" element={<GeneralSettingsSection settings={settings}/>}/>
                        <Route path="/image" element={<ImageSettingsSection settings={settings}/>}/>
                        <Route path="/keymap" element={<KeyMapSettingsSection/>}/>
                    </Routes>
                </Splitter.Panel>
            </Splitter>
        </ConfigProvider>
    )
};

export default Setting;
