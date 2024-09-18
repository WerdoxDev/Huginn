use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};
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
        .close()
        .unwrap()
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
    if let Some(update) = app
        .updater_builder()
        .version_comparator(|current, update| update.version != current)
        .target(target)
        .build()?
        .check()
        .await?
    {
        let mut downloaded = 0;

        app.emit(
            "update-info",
            UpdateInfo {
                body: &update.body,
                current_version: &update.current_version,
                version: &update.version,
            },
        )
        .unwrap();

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
                    println!("download finished");
                    app.emit("update-finished", ()).unwrap();
                },
            )
            .await?;

        println!("update installed");
        app.restart();
    }

    app.emit("update-not-available", ()).unwrap();

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![close_splashscreen, check_update])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// fn setup(app: AppHandle) -> Result<(), Error> {
//     Ok(())
// }
