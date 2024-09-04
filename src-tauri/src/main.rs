// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{CustomMenuItem, Menu, Submenu};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    // here `"quit".to_string()` defines the menu item id, and the second parameter is the menu item label.
    let file_menu = Submenu::new(
        "文件",
        Menu::new()
            .add_item(CustomMenuItem::new("new".to_string(), "新建").accelerator("Ctrl+N"))
            .add_item(CustomMenuItem::new("open".to_string(), "打开").accelerator("Ctrl+O"))
            .add_item(CustomMenuItem::new("save".to_string(), "保存").accelerator("Ctrl+S")),
    );
    let menu = Menu::new().add_submenu(file_menu);

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .menu(menu)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
