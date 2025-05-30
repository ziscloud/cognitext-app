import React, {useState} from 'react';
import type {RadioChangeEvent} from 'antd';
import {Button, Flex, Radio, Typography} from 'antd';
import {open} from '@tauri-apps/plugin-dialog';
import {emit} from '@tauri-apps/api/event';

const {Text} = Typography;

const style: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'start',
    alignContent: 'start',
    flexDirection: 'column',
    gap: 18,
};

interface ActionOnStartupProps {
    settings?: any
}

async function emitEvent(settings:any, action: string, defaultDir: string | null) {
    console.log('action on startup changed', action, defaultDir)
    //这段代码是运行在Setting的Window中，如果要触发到main Window中的事件，需要通过Window之间的通讯协议才行
    await emit('settings-updated', {
        ...settings,
        actionOnStartup: {
            action: action,
            dir: defaultDir
        }
    });
}

const ActionOnStartup: React.FC<ActionOnStartupProps> = ({settings}: ActionOnStartupProps) => {
    const [value, setValue] = useState(settings?.actionOnStartup?.action || 1);
    const [defaultDir, setDefaultDir] = useState<string | null>(settings?.actionOnStartup?.dir);

    const onChange = async (e: RadioChangeEvent) => {
        setValue(e.target.value);
        await emitEvent(settings, e.target.value, defaultDir);
    };

    const onSelect = async () => {
        const file = await open({multiple: false, directory: true, file: false});
        setDefaultDir(file);
        await emitEvent(settings, value, file);
    };

    return (
        <>
            <Typography.Title type="secondary" level={5} style={{whiteSpace: 'nowrap'}}>
                Action on startup:
            </Typography.Title>
            <Radio.Group
                style={style}
                onChange={onChange}
                value={value}
                options={[
                    {
                        value: 1,
                        label: (
                            <Flex gap="small" justify="start" align="start" vertical>
                                <Text>Open the default directory: {defaultDir}</Text>
                                <Button disabled={value !== 1} onClick={onSelect}>Select Folder</Button>
                            </Flex>
                        ),
                    },
                    {
                        value: 2,
                        label: (
                            <Flex gap="small" justify="center" align="center" vertical>
                                <Text>Open a blank page</Text>
                            </Flex>
                        ),
                    },
                ]}
            />
        </>
    );
};

export default ActionOnStartup;
