import React, {useEffect, useState} from 'react';
import {Flex, Splitter, Typography, Input, Menu} from 'antd';
import {AppstoreOutlined, ProductOutlined, SettingOutlined} from '@ant-design/icons';
import {
    Route,
    Routes,
    useNavigate
} from "react-router";
import './Setting.css'
import type {GetProps, MenuProps} from 'antd';
import ActionOnStartup from "./settings/ActionOnStartup.tsx";
import molecule from "@dtinsight/molecule";
import {readTextFile, BaseDirectory, exists} from '@tauri-apps/plugin-fs';
import {SETTINGS_FILE} from "./common/consts.ts";

type SearchProps = GetProps<typeof Input.Search>;

const {Search} = Input;
const onSearch: SearchProps['onSearch'] = (value, _e, info) => console.log(info?.source, value);

type MenuItem = Required<MenuProps>['items'][number];

const items: MenuItem[] = [
    {
        key: 'home',
        label: 'General',
        icon: <ProductOutlined/>,
    },
    {
        key: 'about',
        label: 'Navigation Two',
        icon: <AppstoreOutlined/>,
    },
    {
        type: 'divider',
    },
    {
        key: 'users',
        label: 'Navigation Three',
        icon: <SettingOutlined/>,
    },
    {
        key: 'grp',
        label: 'Group',
        type: 'group',
        children: [
            {key: '13', label: 'Option 13'},
            {key: '14', label: 'Option 14'},
        ],
    },
];

interface HomeProps {
    settings?: any
}

function Home({settings}: HomeProps) {

    return (
        <Flex justify="flex-start" align="start" style={{height: '100%', padding: '0 16px',}} vertical>
            <Typography.Title type="secondary" level={3} style={{whiteSpace: 'nowrap'}}>
                General
            </Typography.Title>
            <Typography.Title type="secondary" level={5} style={{whiteSpace: 'nowrap'}}>
                Action on startup:
            </Typography.Title>
            <ActionOnStartup settings={settings}/>
        </Flex>
    );
}

function About() {
    return <h2>About</h2>;
}

function Users() {
    return <h2>Users</h2>;
}

const Desc: React.FC<Readonly<{ text?: string | number }>> = (props) => {
    const navigate = useNavigate();
    const onClick: MenuProps['onClick'] = ({item, key, keyPath, domEvent}) => {
        console.log('click ', item, key, keyPath, domEvent);
        navigate('/' + key)
    };

    return (

        <Flex justify="flex-start" align="center" style={{height: '100%', overflowX: 'hidden'}} vertical>
            <Typography.Title type="secondary" level={5} style={{whiteSpace: 'nowrap'}}>
                {props.text}
            </Typography.Title>
            <Search placeholder="input search text" onSearch={onSearch}/>
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
    const loadSettings = async () => {
        if (await exists(SETTINGS_FILE, {baseDir: BaseDirectory.AppConfig,})) {
            const settingsJson = await readTextFile(SETTINGS_FILE, {
                baseDir: BaseDirectory.AppConfig,
            });
            return JSON.parse(settingsJson);
        }
        return molecule.settings.getSettings();
    }

    useEffect(() => {
        loadSettings().then(settings => {
            setSettings(settings);
        })
    }, [])

    return (
        <Splitter style={{height: '100%'}}>
            <Splitter.Panel defaultSize="30%" min="30%" max="50%">
                <Desc text="Preferences"/>
            </Splitter.Panel>
            <Splitter.Panel>

                <Routes>
                    <Route index path="/home" element={<Home settings={settings}/>}/>
                    <Route path="/about" element={<About/>}/>

                    <Route path="/users" element={<Users/>}/>


                </Routes>
            </Splitter.Panel>
        </Splitter>
    )
};

export default Setting;
