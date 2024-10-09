use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, WindowEvent};
use tauri_plugin_updater::UpdaterExt;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct UpdateProgress {
    downloaded: usize,
    content_length: Option<u64>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct UpdateInfo<'a> {
    body: &'a Option<String>,
    current_version: &'a String,
    version: &'a String,
}

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
        .hide()
        .unwrap();

    app.emit("splashscreen-close", ()).unwrap();
}

#[tauri::command]
async fn open_splashscreen(app: AppHandle) {
    // Hide main window
    app.get_webview_window("main")
        .expect("no window labeled 'main' found")
        .hide()
        .unwrap();

    // Show splashscreen window
    app.get_webview_window("splashscreen")
        .expect("no window labeled 'splashscreen' found")
        .show()
        .unwrap();

    app.emit("splashscreen-open", ()).unwrap();
}

#[tauri::command]
async fn check_update(app: tauri::AppHandle, target: String) -> tauri::Result<()> {
    let handle = app.app_handle().clone();
    tauri::async_runtime::spawn(async move {
        let _ = update(handle, target).await;
    });

    Ok(())
}

async fn update(app: AppHandle, target: String) -> Result<(), tauri_plugin_updater::Error> {
    println!("Checking update...");
    if let Some(update) = app
        .updater_builder()
        .version_comparator(|current, update| update.version != current)
        .target(target)
        .build()?
        .check()
        .await?
    {
        let mut downloaded = 0;

        println!("Sending update info...");

        app.emit(
            "update-info",
            UpdateInfo {
                body: &update.body,
                current_version: &update.current_version,
                version: &update.version,
            },
        )
        .unwrap();

        println!("Downloading update...");

        update
            .download_and_install(
                |chunk_length, content_length| {
                    downloaded += chunk_length;
                    println!("downloaded {downloaded} from {content_length:?}");
                    app.emit(
                        "update-progress",
                        UpdateProgress {
                            downloaded,
                            content_length,
                        },
                    )
                    .unwrap();
                },
                || {
                    println!("Download finished!");
                    app.emit("update-finished", ()).unwrap();
                },
            )
            .await?;

        println!("Update installed!");
        app.restart();
    }

    app.emit("update-not-available", ()).unwrap();

    println!("No update!");

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            close_splashscreen,
            open_splashscreen,
            check_update
        ])
        .on_window_event(|window, event| match event {
            WindowEvent::Destroyed => {
                let windows = window.app_handle().webview_windows();
                //  window.app_handle().exit(0);

                for (_name, window) in windows.iter() {
                    window.close().unwrap();
                }
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// fn setup(app: AppHandle) -> Result<(), Error> {
//     Ok(())
// }
