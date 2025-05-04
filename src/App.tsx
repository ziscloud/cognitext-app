// import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import molecule, { create, Workbench } from '@dtinsight/molecule';
import '@dtinsight/molecule/esm/style/mo.css';
import extensions from "./extensions";

const moInstance = create({
    extensions: extensions,
});

moInstance.onBeforeInit(() => {
    //const modules = molecule.builtin.getModules();
    //console.log('builtin modules', modules)
    molecule.builtin.inactiveModule("builtInPanelProblems")
    molecule.builtin.inactiveModule("builtInMenuBarData")
    molecule.builtin.inactiveModule("builtInPanelToolboxResize")
    molecule.builtin.inactiveModule("builtInPanelToolboxReStore")
    molecule.builtin.inactiveModule("builtInPanelToolbox")
    molecule.builtin.inactiveModule("builtInExplorerEditorPanel")
    molecule.builtin.inactiveModule("builtInExplorerOutlinePanel")
    molecule.builtin.inactiveModule("builtInStatusProblems")
    molecule.builtin.inactiveModule("builtInNotification")
    molecule.builtin.inactiveModule("BuiltInSettingsTab")
    molecule.builtin.inactiveModule("builtInOutputPanel")
    molecule.builtin.inactiveModule("quickAcessViewAction")
    molecule.builtin.inactiveModule("quickSelectColorThemeAction")
    molecule.builtin.inactiveModule("quickSelectLocaleAction")
    molecule.builtin.inactiveModule("quickTogglePanelAction")
    molecule.builtin.inactiveModule("quickSelectAllAction")
    molecule.builtin.inactiveModule("quickCopyLineUpAction")
    molecule.builtin.inactiveModule("quickUndoAction")
    molecule.builtin.inactiveModule("quickRedoAction")
})

function App() {
  // const [greetMsg, setGreetMsg] = useState("");
  // const [name, setName] = useState("");
  //
  // async function greet() {
  //   // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
  //   setGreetMsg(await invoke("greet", { name }));
  // }

  return (
      moInstance.render(<Workbench />)
  );
}

export default App;
