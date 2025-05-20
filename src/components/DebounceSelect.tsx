import React, {useMemo, useRef, useState} from 'react';
import type {SelectProps} from 'antd';
import {Select, Spin} from 'antd';
import {debounce} from 'lodash-es';
import {DirEntry} from "@tauri-apps/plugin-fs";
import {EntryItem} from './FolderTree';

export interface DebounceSelectProps<ValueType = String> extends Omit<SelectProps<ValueType | ValueType[]>, 'options' | 'children'> {
    debounceTimeout?: number,
    dataSource?: Map<string, EntryItem>,
}

function DebounceSelect<
    ValueType extends {
        key?: string;
        label: React.ReactNode;
        value: string | number;
        avatar?: string;
    } = any,
>({dataSource, debounceTimeout = 300, ...props}: DebounceSelectProps<ValueType>) {
    const [fetching, setFetching] = useState(false);
    const [options, setOptions] = useState<DirEntry[]>([]);
    const fetchRef = useRef(0);

    const debounceFetcher = useMemo(() => {
        const loadOptions = (value: string) => {
            fetchRef.current += 1;
            const fetchId = fetchRef.current;
            setOptions([]);
            setFetching(true);

            if (fetchId !== fetchRef.current) {
                // for fetch callback order
                return;
            }
            //@ts-ignore
            const candidates = [];
            dataSource?.forEach((entry, key) => {
                if (entry.entry.isFile && entry.entry.name.toLowerCase().includes(value?.toLowerCase())) {
                    candidates.push(
                        {
                            value: key,
                            label: entry.entry.name,
                        }
                    );
                }
            });
            //@ts-ignore
            setOptions(candidates);
            setFetching(false);
        };

        return debounce(loadOptions, debounceTimeout);
    }, [dataSource, debounceTimeout]);

    return (
        <Select
            {...props}
            showSearch
            className={'search-file-name'}
            allowClear={true}
            filterOption={false}
            onSearch={debounceFetcher}
            notFoundContent={fetching ? <Spin size="small"/> : 'No results found'}
            options={options}
        />
    );
}

export default DebounceSelect;
