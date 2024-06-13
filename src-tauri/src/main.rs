// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{utils::config::AppUrl, Manager, Window, WindowUrl};
use window_shadows::set_shadow;

#[tauri::command]
async fn close_splashscreen(window: Window) {
    // Show main window
    window
        .get_window("main")
        .expect("no window labeled 'main' found")
        .show()
        .unwrap();

    // Hide splashscreen window
    window
        .get_window("splashscreen")
        .expect("no window labeled 'splashscreen' found")
        .close()
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
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            set_shadow(&window, true).expect("Unsupported platform!");
            let splashscreen = app.get_window("splashscreen").unwrap();
            set_shadow(&splashscreen, true).expect("Unsupported platform!");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![close_splashscreen])
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
