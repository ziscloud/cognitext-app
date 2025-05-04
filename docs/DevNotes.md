# 开发NOTES

## 保存和恢复编辑器视图状态

在controller/editor.tsx中，通过下面的代码来保存和恢复编辑器视图状态：


```tsx
        editorInstance.onDidBlurEditorText(() => {
            const { current } = this.editorService.getState();
            const tab = current?.tab;
            if (tab?.id) {
                const viewState = editorInstance?.saveViewState();
                this.editorStates.set(tab.id?.toString(), viewState);
            }
        });
```

```ts
        /**
         * Open a tab via instance.
         * Actually, one tab to one Model, so that
         * - the action to open a exist tab equals to switch the model in instance
         * - the action to open a new tab equals to create a new model in instance
         */
        private openTab(
            editorInstance: MonacoEditor.IStandaloneCodeEditor,
            path: string,
            value: string,
            language: string
        ) {
            let model = MonacoEditor.getModel(Uri.parse(path));
            if (!model) {
                model = MonacoEditor.createModel(value, language, Uri.parse(path));
            }
        
            // 1. switch model
            editorInstance.setModel(model);
            // 2. Restore view state
            const editorState = this.editorStates.get(path);
        
            if (editorState) {
                // viewState contains: scroller info, cursor info, contributions info
                editorInstance.restoreViewState(editorState);
            }
        
            editorInstance?.focus();
        }

```

MonacoEditor的editorInstanceRef，会调用onUpdateEditorIns?.(editorInstance, id!);

```tsx
    public onUpdateEditorIns = (
    editorInstance: MonacoEditor.IStandaloneCodeEditor,
    groupId: UniqueId
) => {
    if (!editorInstance) return;

    this.initEditorEvents(editorInstance, groupId); // 注册事件，比如失去焦点，触发保存编辑器视图状态
    this.editorService.updateGroup(groupId, {
        editorInstance: editorInstance,
    });
    this.editorService.updateCurrentGroup({ editorInstance });

    const { current } = this.editorService.getState();
    const tab = current?.tab;

    this.openTab(
        editorInstance,
        tab!.id!.toString(),
        tab?.data?.value!,
        tab?.data?.language!
    ); // tab应该是已经打开了，这里主要是恢复编辑器视图状态

    this.onEditorInstanceMount(editorInstance);
};
```
