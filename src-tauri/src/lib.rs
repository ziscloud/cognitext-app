// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
// use tauri::{
//     menu::{AboutMetadata, MenuBuilder, MenuItemBuilder, SubmenuBuilder},
//     Manager,
// };

// use tauri::Emitter;


mod git;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            git::git_status,
            git::git_commit,
            git::git_history,
            git::git_add,
            git::git_commit_changes
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
