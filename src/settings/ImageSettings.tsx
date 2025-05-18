import React, {useEffect, useState} from 'react';
import {Button, Flex, Input, Select, Switch, Typography} from 'antd';
import {open} from '@tauri-apps/plugin-dialog';
import {emit} from '@tauri-apps/api/event';

const {Text} = Typography;

interface ActionOnStartupProps {
    settings?: any
}

async function emitEvent(settings, action: string, globalDir: string | null, preferRelativeFolder: boolean, relativeFolderName: string) {
    console.log('action on startup changed', action, globalDir)
    //这段代码是运行在Setting的Window中，如果要触发到main Window中的事件，需要通过Window之间的通讯协议才行
    await emit('settings-updated', {
        ...settings,
        image: {
            action,
            globalDir,
            preferRelativeFolder,
            relativeFolderName,
        }
    });
}

const ImageSettings: React.FC<ActionOnStartupProps> = ({settings}: ActionOnStartupProps) => {
    const [value, setValue] = useState(settings?.image?.action || 1);
    const [globalDir, setGlobalDir] = useState<string>(settings?.image?.globalDir);
    const [preferRelativeFolder, setPreferRelativeFolder] = useState<boolean>(settings?.image?.preferRelativeFolder);
    const [relativeFolderName, setRelativeFolderName] = useState<string>(settings?.image?.relativeFolerName || '${filename}.assets');

    const onChange = async (value: string) => {
        setValue(value);
    };

    const onSelect = async () => {
        const file = await open({multiple: false, directory: true, file: false, defaultPath: globalDir});
        //@ts-ignore
        setGlobalDir(file);
    };

    const onSwitchChange = (checked: boolean) => {
        console.log(`switch to ${checked}`);
        setPreferRelativeFolder(checked);
    };

    useEffect(() => {
        emitEvent(settings, value, globalDir, preferRelativeFolder, relativeFolderName);
    }, [value, globalDir, preferRelativeFolder, relativeFolderName]);

    return (
        <>
            <Typography.Title type="secondary" level={5} style={{whiteSpace: 'nowrap'}}>
                Default action after an image is inserted from local folder or clipboard:
            </Typography.Title>
            <Select<string>
                defaultValue={value}
                style={{width: '100%'}}
                onChange={onChange}
                options={[
                    {value: 1, label: 'Copy image to designated relative assets or global local folder'},
                    {value: 2, label: 'Keep original location'},
                    {value: 3, label: 'Upload image cloud using selected uploader (must be configured below)'},
                ]}
            />
            <Typography.Title type="secondary" level={3} style={{whiteSpace: 'nowrap'}}>
                Global or relative image folder
            </Typography.Title>
            <Typography.Title type="secondary" level={5} style={{whiteSpace: 'nowrap'}}>
                Global image folder:
            </Typography.Title>
            <Input defaultValue={globalDir} onChange={(e) => setGlobalDir(e.target.value)}/>
            <Button onClick={onSelect} style={{marginTop: '8px'}}>Select Folder</Button>
            <Flex justify="space-between" align="flex-end" style={{width: '100%'}}>
                <Typography.Title type="secondary" level={5} style={{whiteSpace: 'nowrap'}}>
                    Prefer relative assets image folder:
                </Typography.Title>
                <Switch defaultChecked onChange={onSwitchChange} style={{marginBottom: '8px'}}/>
            </Flex>
            <Typography.Title type="secondary" level={5} style={{whiteSpace: 'nowrap'}}>
                Relative image folder name:
            </Typography.Title>
            <Input defaultValue={relativeFolderName} onChange={(e) => setRelativeFolderName(e.target.value)}/>
            <Text type="secondary">Include {("${filename}")} in the text-box above to automatically insert the document
                file name.</Text>
        </>
    );
};

export default ImageSettings;
