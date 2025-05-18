import React, {useState} from 'react';
import {SearchOutlined,} from '@ant-design/icons';
import {Flex, MenuProps} from 'antd';
import {Layout, Menu, theme} from 'antd';
import {IoLogoMarkdown} from "react-icons/io";
import {HiOutlineChatAlt2} from "react-icons/hi";

const {Sider} = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
    label: React.ReactNode,
    key: React.Key,
    icon?: React.ReactNode,
    children?: MenuItem[],
): MenuItem {
    return {
        key,
        icon,
        children,
        label,
    } as MenuItem;
}

const items: MenuItem[] = [
    getItem('Notes', 'notes', <IoLogoMarkdown size={24}/>),
    getItem('Search', 'search', <SearchOutlined size={24}/>),
    getItem('AI Chat', 'chat', <HiOutlineChatAlt2 size={24}/>),
];

interface SideProps {
    onMenuClick: any
}

const Side: React.FC<SideProps> = ({onMenuClick}: SideProps) => {
    const [collapsed, setCollapsed] = useState(true);
    const {
        token: {colorBgContainer, borderRadiusLG},
    } = theme.useToken();

    return (
        <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)} collapsedWidth={56}
               width={160}>
            <Flex style={{width: '100%', marginTop:'12px', marginBottom:'12px'}} align={'center'} justify={'center'}><img src={'/logo.svg'} style={{width: '38px'}}/></Flex>
            <Menu className="menu" theme="dark" defaultSelectedKeys={['notes']} mode="inline" items={items} onClick={onMenuClick}/>
        </Sider>
    )
}

export default Side;
