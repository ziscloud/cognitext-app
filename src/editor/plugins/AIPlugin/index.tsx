/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {JSX, useEffect, useRef} from 'react';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
    $createParagraphNode,
    $getRoot,
    COMMAND_PRIORITY_EDITOR,
    createCommand,
    ElementNode,
    LexicalCommand
} from 'lexical';
import {$convertFromMarkdownString, $convertToMarkdownString} from "@lexical/markdown";
import {PLAYGROUND_TRANSFORMERS} from "../MarkdownTransformers";
import {useXAgent} from "@ant-design/x";
import {useSettings} from "../../../settings/SettingsContext.tsx";
import {Button, message, Space} from "antd";
import {FaStop} from "react-icons/fa6";

export const AI_CONTINUE_WRITING_COMMAND: LexicalCommand<void> = createCommand(
    'AI_CONTINUE_WRITING_COMMAND',
);

interface YourMessageType {
    role: string;
    content: string;
}

export default function AIPlugin(): JSX.Element | null {
    const [editor] = useLexicalComposerContext();
    const settings = useSettings();
    const [messageApi, contextHolder] = message.useMessage();
    const [agent] = useXAgent<YourMessageType>({
        baseURL: settings.chat.baseUrl,
        model: settings.chat.model,
        dangerouslyApiKey: 'Bearer ' + settings.chat.apiKey
    });
    const abortController = useRef<AbortController>(null);

    const show = () => {
        messageApi.open({
            type: "loading",
            content: (
                <Space>
                    <span>The AI Model ({settings.chat.model}) is writing for you, click to abort</span>
                    <Button size={"small"} icon={<FaStop/>} onClick={() => {
                        abortController?.current?.abort?.();
                    }}/>
                </Space>
            ),
            style: {
                marginTop: "7vh",
            },
            duration: 0,
        });
    }

    useEffect(() => {
        return editor.registerCommand<string>(
            AI_CONTINUE_WRITING_COMMAND,
            () => {
                let markdown = $convertToMarkdownString(
                    PLAYGROUND_TRANSFORMERS,
                    undefined, //node
                    false,
                );
                show();
                let paragraphNode: ElementNode | null = null;
                let thinkNode: ElementNode | null = null;
                let generated: string = '';
                let thinkContent: string = '<think>';
                agent.request({
                        messages: [
                            {
                                role: 'assistant',
                                content: "角色：你是一个专业的文字创作助手，任务是精准延续用户的文字内容。  \n" +
                                    "任务：根据用户提供的文本片段，分析其语言风格、主题、情感和逻辑，生成无缝衔接的后续内容。  \n" +
                                    "要求：\n" +
                                    "1. 严格延续风格：模仿原文本的措辞、句式、节奏（如正式/口语化、简洁/华丽）。\n" +
                                    "2. 保持逻辑一致：延续原有叙事或论证逻辑，禁止偏离主题或引入冲突信息。\n" +
                                    "3. 开放性结尾：避免强行终结内容，保持可继续扩展的空间。\n" +
                                    "4. 以markdown的语法格式输出内容。\n" +
                                    "5. 不要在输出的文本中包含用户提供的文本片段，只输出后续内容即可。" +
                                    "6. 使用用户文本的主要语言进行输出，例如，主要是中文，那就用中文，主要是英文，就用英文。\n"
                            },
                            {role: 'user', content: markdown}
                        ],
                        stream: true,
                    },
                    {
                        onSuccess: (_) => {
                            editor.update(() => {
                                thinkNode?.remove();
                            })
                            messageApi.destroy();
                        },
                        onError: (error) => {
                            console.error('onError', error);
                            messageApi.destroy();
                        },
                        onUpdate: (chunk) => {
                            let currentContent = '';
                            let currentThink = '';
                            try {
                                if (chunk?.data && !chunk?.data.includes('DONE')) {
                                    const message = JSON.parse(chunk?.data);
                                    currentThink = message?.choices?.[0]?.delta?.reasoning_content || '';
                                    currentContent = message?.choices?.[0]?.delta?.content || '';
                                    if (currentThink) {
                                        thinkContent += currentThink;
                                        if (!thinkNode) {
                                            editor.update(() => {
                                                thinkNode = $createParagraphNode();
                                                $getRoot().append(thinkNode);
                                            });
                                        }
                                        editor.update(() => {
                                            //@ts-ignore
                                            $convertFromMarkdownString(thinkContent, PLAYGROUND_TRANSFORMERS, thinkNode);
                                        });
                                    }
                                    if (currentContent) {
                                        generated += currentContent;
                                        if (!paragraphNode) {
                                            editor.update(() => {
                                                paragraphNode = $createParagraphNode();
                                                $getRoot().append(paragraphNode);
                                                if (thinkContent && thinkNode) {
                                                    thinkContent += '</think>';
                                                    editor.update(() => {
                                                        //@ts-ignore
                                                        $convertFromMarkdownString(thinkContent, PLAYGROUND_TRANSFORMERS, thinkNode);
                                                    });
                                                }
                                            });
                                        }
                                        editor.update(() => {
                                            //@ts-ignore
                                            $convertFromMarkdownString(generated, PLAYGROUND_TRANSFORMERS, paragraphNode);
                                        });

                                    }
                                }
                            } catch (error) {
                                console.error(error);
                            }
                        },
                        onStream: controller => {
                            //@ts-ignore
                            abortController.current = controller;
                        }
                    },)
                return true;
            },
            COMMAND_PRIORITY_EDITOR,
        );
    }, [editor]);

    return (<>
        {contextHolder}
    </>);
}
