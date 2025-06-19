// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
// use tauri::{
//     menu::{AboutMetadata, MenuBuilder, MenuItemBuilder, SubmenuBuilder},
//     Manager,
// };

// use tauri::Emitter;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_shell::init())
        //         .setup(|app| {
        //             //let handle = app.handle();
        //
        //             // my custom settings menu item
        //             let settings = MenuItemBuilder::new("Settings...")
        //                 .id("settings")
        //                 .accelerator("CmdOrCtrl+,")
        //                 .build(app)?;
        //
        //             // my custom app submenu
        //             let app_submenu = SubmenuBuilder::new(app, "App")
        //                 .about(Some(AboutMetadata {
        //                     ..Default::default()
        //                 }))
        //                 .separator()
        //                 .item(&settings)
        //                 .separator()
        //                 .services()
        //                 .separator()
        //                 .hide()
        //                 .hide_others()
        //                 .quit()
        //                 .build()?;
        //
        //             // ... any other submenus
        //
        //             let menu = MenuBuilder::new(app)
        //                 .items(&[
        //                     &app_submenu,
        //                     // ... include references to any other submenus
        //                 ])
        //                 .build()?;
        //
        //             // set the menu
        //             app.set_menu(menu)?;
        //
        //             // listen for menu item click events
        // //             app.on_menu_event(move |app, event| {
        // //                 if event.id() == settings.id() {
        // //                     // emit a window event to the frontend
        // //                     let _event = app.emit("custom-event", "/settings");
        // //                 }
        // //             });
        //
        //             Ok(())
        //         })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
