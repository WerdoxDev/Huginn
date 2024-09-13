// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{AppHandle, Manager};

#[tauri::command]
async fn close_splashscreen(app: AppHandle) {
    // Show main window
    app.get_webview_window("main")
        .expect("no window labeled 'main' found")
        .show()
        .unwrap();

    // Hide splashscreen window
    app.get_webview_window("splashscreen")
        .expect("no window labeled 'splashscreen' found")
        .close()
        .unwrap()
}

fn main() {
    let port = 3002;

    tauri::Builder::default()
        .setup(|app| {
            #[cfg(desktop)]
            let _ = app
                .handle()
                .plugin(tauri_plugin_updater::Builder::new().build());
            Ok(())
        })
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![close_splashscreen])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    //  let mut context = tauri::generate_context!();
    //  let url = format!("http://localhost:{}", port).parse().unwrap();
    //  let window_url = WindowUrl::External(url);
    // rewrite the config so the IPC is enabled on this URL
    //  context.config_mut().build.dist_dir = AppUrl::Url(window_url.clone());

    //  tauri::Builder::default()
    //      .setup(|app| {
    //          let window = app.get_window("main").unwrap();
    //          set_shadow(&window, true).expect("Unsupported platform!");
    //          let splashscreen = app.get_window("splashscreen").unwrap();
    //          set_shadow(&splashscreen, true).expect("Unsupported platform!");
    //          Ok(())
    //      })
    //      .invoke_handler(tauri::generate_handler![close_splashscreen])
    //      .plugin(tauri_plugin_localhost::Builder::new(port).build())
    //      .build(context)
    //      // .run(context)
    //      .expect("error while running tauri application")
    //      .run(|_, e| match e {
    //          tauri::RunEvent::Updater(event) => {
    //              dbg!(event);
    //          }
    //          _ => (),
    //      });
}
