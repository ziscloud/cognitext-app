import {JSX, useEffect} from 'react';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$wrapNodeInElement, mergeRegister} from '@lexical/utils';
import {$createParagraphNode, $insertNodes, $isRootOrShadowRoot, COMMAND_PRIORITY_LOW,} from 'lexical';

import {$createImageNode, ImageNode,} from '../../nodes/ImageNode';

import {exists, mkdir, writeFile} from '@tauri-apps/plugin-fs';
import {basename, dirname, join} from '@tauri-apps/api/path';
import {useSettings} from "../../../settings/SettingsContext.tsx";
import {useFile} from "../../context/FileContext.tsx";
import {INSERT_IMAGE_COMMAND, InsertImagePayload} from "../ImagesPlugin";
import {Button, message, Space, Typography} from "antd";
import {showSettings} from "../../../App.tsx";

function base64ToArrayBuffer(base64: string): Uint8Array {
    // 移除 Data URL 前缀（如 "data:image/png;base64,"）
    const base64Str = base64.split(',')[1] || base64;

    // 解码 Base64 字符串为二进制字符串
    const binaryStr = atob(base64Str);

    // 将二进制字符串转换为 Uint8Array
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }

    return bytes; // 返回 ArrayBuffer
}


export default function ImagePastingPlugin(): JSX.Element | null {
    const [editor] = useLexicalComposerContext();
    const settings = useSettings();
    const file = useFile();

    function showImageSettings(msg: string) {
        message.open({
            type: "info",
            content: (
                <Space>
                    <Typography.Text type={'warning'}>{msg}</Typography.Text>
                    <Button size={"small"} type={"link"} onClick={async () => {
                        await showSettings('/image');
                        message.destroy();
                    }}>Open Settings</Button>
                </Space>
            ),
            style: {
                marginTop: "7vh",
            },
            duration: 0,
        })
    }

    async function saveImageToFile(imageFileBaseName: string, imagePayload: InsertImagePayload) {
        if (!settings.image) {
            console.error('ImagePastingPlugin: Image settings are not configured.');
            showImageSettings('Image settings are not configured.');
            return;
        }

        if (settings.image.action === 1) {
            //Copy image to designated relative assets or global local folder
            if (settings.image.preferRelativeFolder) {
                const mdFileName = await basename(file.path, ".md");
                let dirName = mdFileName + '.assets'
                if (settings.image.relativeFolderName) {
                    dirName = settings.image.relativeFolderName.replace('${filename}', mdFileName)
                }
                const toDir = await join(await dirname(file.path), dirName);
                const dirExists = await exists(toDir);
                if (!dirExists) {
                    await mkdir(toDir, {recursive: true});
                }
                const filePath = await join(toDir, imageFileBaseName);

                await writeFile(filePath, base64ToArrayBuffer(imagePayload.src));

                return await join(dirName, imageFileBaseName)
            } else {
                if (settings.image.globalDir) {
                    const dirExists = await exists(settings.image.globalDir);
                    if (!dirExists) {
                        await mkdir(settings.image.globalDir, {recursive: true});
                    }
                    const filePath = await join(settings.image.globalDir, imageFileBaseName);
                    await writeFile(filePath, base64ToArrayBuffer(imagePayload.src));
                    return filePath;
                } else {
                    showImageSettings('Image folder is not configured.');
                }
            }
        } else if (settings.image.action === 3) {
            //Upload image cloud using selected uploader (must be configured below)
            console.error('ImagePastingPlugin: Uploading images is not supported yet.');
            showImageSettings('Uploading images is not supported yet.');
        } else {
            //Keep original location
            console.error('ImagePastingPlugin: Keeping original location is not supported yet.')
            showImageSettings('Keeping original location is not supported yet.');
        }
    }

    useEffect(() => {
        if (!editor.hasNodes([ImageNode])) {
            throw new Error('ImagesPlugin: ImageNode not registered on editor');
        }

        return mergeRegister(
            editor.registerCommand<InsertImagePayload>(
                INSERT_IMAGE_COMMAND,
                (imagePayload) => {
                    const imageFileBaseName = `${Date.now()}-${imagePayload.altText}`;
                    saveImageToFile(imageFileBaseName, imagePayload).then((filePath) => {
                        if (filePath) {
                            editor.update(() => {
                                const imageNode = $createImageNode({...imagePayload, src: filePath});
                                $insertNodes([imageNode]);
                                if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
                                    $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
                                }
                            });
                        }
                    });
                    return true;
                },
                COMMAND_PRIORITY_LOW,
            )
        );
    }, [editor]);

    return null;
}


