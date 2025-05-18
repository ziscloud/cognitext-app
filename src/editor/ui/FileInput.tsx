/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {JSX} from 'react';

import './Input.css';
import {Button} from "antd";
import {open} from '@tauri-apps/plugin-dialog';


type Props = Readonly<{
    'data-test-id'?: string;
    accept?: string;
    label: string;
    onChange: (files: string | null) => void;
}>;

export default function FileInput({
                                      accept,
                                      label,
                                      onChange,
                                      'data-test-id': dataTestId,
                                  }: Props): JSX.Element {
    return (
        <div className="Input__wrapper">
            <label className="Input__label">{label}</label>
            <Button onClick={async () => {
                const file = await open({
                    multiple: false,
                    directory: false,
                    filters: [
                        {
                            name: 'My Filter',
                            extensions: ['png', 'jpeg', 'svg', 'jpg', 'gif'],
                        },
                    ],
                });
                onChange(file);
            }}>Select Image File</Button>
            <input
                type="file"
                style={{display: 'none'}}
                accept={accept}
                className="Input__input"
                onChange={(_) => {/*onChange(e.target.files)*/}}
                data-test-id={dataTestId}
            />
        </div>
    );
}
