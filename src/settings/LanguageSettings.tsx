import React, {useEffect, useState} from 'react';
import {Select, Typography} from 'antd';
import {emit} from '@tauri-apps/api/event';

const {Text} = Typography;

interface ActionOnStartupProps {
    settings?: any
}

async function emitEvent(settings, locale: string) {
    console.log('action on startup changed', locale)
    //这段代码是运行在Setting的Window中，如果要触发到main Window中的事件，需要通过Window之间的通讯协议才行
    await emit('settings-updated', {
        ...settings,
        locale: locale
    });
}

const LanguageSettings: React.FC<ActionOnStartupProps> = ({settings}: ActionOnStartupProps) => {
    const [locale, setLocale] = useState(settings?.locale || 'en');

    const onChange = async (value: string) => {
        setLocale(value);
    };

    useEffect(() => {
        emitEvent(settings, locale);
    }, [locale]);

    return (
        <>
            <Typography.Title type="secondary" level={5} style={{whiteSpace: 'nowrap'}}>
                User interface language:
            </Typography.Title>
            <Select<string>
                defaultValue={locale}
                style={{width: '100%'}}
                onChange={onChange}
                options={[
                    {value: 'en', label: 'English'},
                    {value: 'zh-CN', label: '简体中文'},
                ]}
            />
            <Text type="secondary">Application need to restart to make the change of language take effect.</Text>
        </>
    );
};

export default LanguageSettings;
