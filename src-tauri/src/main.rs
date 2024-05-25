// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{utils::config::AppUrl, Manager, Window, WindowUrl};

#[tauri::command]
async fn open_main(window: Window) {
    // Show main window
    window
        .get_window("main")
        .expect("no window labeled 'main' found")
        .show()
        .unwrap();
}

#[tauri::command]
async fn hide_splashscreen(window: Window) {
    // Hide splashscreen window
    window
        .get_window("splashscreen")
        .expect("no window labeled 'splashscreen' found")
        .hide()
        .unwrap()
}

fn main() {
    let port = 3002;

    let mut context = tauri::generate_context!();
    let url = format!("http://localhost:{}", port).parse().unwrap();
    let window_url = WindowUrl::External(url);
    // rewrite the config so the IPC is enabled on this URL
    context.config_mut().build.dist_dir = AppUrl::Url(window_url.clone());

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_main, hide_splashscreen])
        .plugin(tauri_plugin_localhost::Builder::new(port).build())
        .build(context)
        // .run(context)
        .expect("error while running tauri application")
        .run(|_, e| match e {
            tauri::RunEvent::Updater(event) => {
                dbg!(event);
            }
            _ => (),
        });
}
