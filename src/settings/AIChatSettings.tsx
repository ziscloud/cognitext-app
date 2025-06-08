import React, {useEffect, useState} from 'react';
import {Input, Select, Typography} from 'antd';
import {emit} from '@tauri-apps/api/event';

interface ActionOnStartupProps {
    settings?: any
}

async function emitEvent(settings: any, provider: string, baseUrl: string, apiKey: string, model: string) {
    //这段代码是运行在Setting的Window中，如果要触发到main Window中的事件，需要通过Window之间的通讯协议才行
    await emit('settings-updated', {
        ...settings,
        chat: {
            provider, baseUrl, apiKey, model
        }
    });
}

const AIChatSettings: React.FC<ActionOnStartupProps> = ({settings}: ActionOnStartupProps) => {
    const [provider, setProvider] = useState<string>(settings?.chat?.provider);
    const [baseUrl, setBaseUrl] = useState<string>(settings?.chat?.baseUrl);
    const [apiKey, setApiKey] = useState<string>(settings?.chat?.apiKey);
    const [model, setModel] = useState<string>(settings?.chat?.model);

    const onChange = async (value: string) => {
        setProvider(value);
    };
    useEffect(() => {
        emitEvent(settings, provider, baseUrl, apiKey, model);
    }, [provider, baseUrl, apiKey, model]);

    return (
        <>
            <Typography.Title type="secondary" level={5} style={{whiteSpace: 'nowrap'}}>
                Chat Provider:
            </Typography.Title>
            <Select<string>
                defaultValue={provider}
                style={{width: '100%'}}
                onChange={onChange}
                options={[
                    {value: 'deepseek', label: 'DeepSeek'},
                    {value: 'openai', label: 'OpenAI'},
                ]}
            />
            <Typography.Title type="secondary" level={5} style={{whiteSpace: 'nowrap'}}>
                Base URL:
            </Typography.Title>
            <Input defaultValue={baseUrl} onChange={(e) => setBaseUrl(e.target.value)}/>
            <Typography.Title type="secondary" level={5} style={{whiteSpace: 'nowrap'}}>
                API Key:
            </Typography.Title>
            <Input.Password defaultValue={apiKey} onChange={(e) => setApiKey(e.target.value)}/>
            <Typography.Title type="secondary" level={5} style={{whiteSpace: 'nowrap'}}>
                Model:
            </Typography.Title>
            <Input defaultValue={model} onChange={(e) => setModel(e.target.value)}/>
            {/*<Typography.Title type="secondary" level={3} style={{whiteSpace: 'nowrap'}}>*/}
            {/*    Global or relative image folder*/}
            {/*</Typography.Title>*/}
            {/*<Typography.Title type="secondary" level={5} style={{whiteSpace: 'nowrap'}}>*/}
            {/*    Global image folder:*/}
            {/*</Typography.Title>*/}
            {/*<Input defaultValue={globalDir} onChange={(e) => setGlobalDir(e.target.value)}/>*/}
            {/*<Button onClick={onSelect} style={{marginTop: '8px'}}>Select Folder</Button>*/}
            {/*<Flex justify="space-between" align="flex-end" style={{width: '100%'}}>*/}
            {/*    <Typography.Title type="secondary" level={5} style={{whiteSpace: 'nowrap'}}>*/}
            {/*        Prefer relative assets image folder:*/}
            {/*    </Typography.Title>*/}
            {/*    <Switch defaultChecked onChange={onSwitchChange} style={{marginBottom: '8px'}}/>*/}
            {/*</Flex>*/}
            {/*<Typography.Title type="secondary" level={5} style={{whiteSpace: 'nowrap'}}>*/}
            {/*    Relative image folder name:*/}
            {/*</Typography.Title>*/}
            {/*<Input defaultValue={relativeFolderName} onChange={(e) => setRelativeFolderName(e.target.value)}/>*/}
            {/*<Text type="secondary">Include {("${filename}")} in the text-box above to automatically insert the document*/}
            {/*    file name.</Text>*/}
        </>
    );
};

export default AIChatSettings;
