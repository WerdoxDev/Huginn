use std::fs;
use std::{env, path::Path};

// extern crate winrt_notification;
use serde::Serialize;
use serde_json::Value;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, LogicalSize, Manager, WindowEvent};
use tauri_plugin_updater::UpdaterExt;
use tauri_winrt_notification::{Duration, IconCrop, Toast};

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
async fn open_and_focus_main(app: AppHandle) {
    let window = app
        .get_webview_window("main")
        .expect("no window labeled 'main' found");

    let _ = window.show();
    let _ = window.set_focus();
    let _ = window.unminimize();
}

#[tauri::command]
async fn close_main(app: AppHandle) {
    // Hide main window
    app.get_webview_window("main")
        .expect("no window labeled 'main' found")
        .hide()
        .unwrap();
}

#[tauri::command]
async fn splashscreen_mode(app: AppHandle) {
    let window = app
        .get_webview_window("main")
        .expect("no window labeled 'main' found");
    let _ = window.set_resizable(false);
    let _ = window.set_maximizable(false);
    let _ = window.set_size(LogicalSize::new(300, 300));
    let _ = window.center();
}

#[tauri::command]
async fn main_mode(app: AppHandle) {
    let window = app
        .get_webview_window("main")
        .expect("no window labeled 'main' found");
    let _ = window.set_resizable(true);
    let config = window.config();
    let min_height = config.app.windows[0].min_height.unwrap();
    let min_width = config.app.windows[0].min_width.unwrap();

    let _ = window.set_size(LogicalSize::new(min_width, min_height));
    let _ = window.center();
}

#[tauri::command]
async fn check_update(app: AppHandle, target: String) {
    let handle = app.app_handle().clone();
    tauri::async_runtime::spawn(async move {
        match update(handle, target).await {
            Ok(()) => println!("Update was ok"),
            Err(_) => app.emit("update-failed", ()).unwrap(),
        }
    });
}

#[tauri::command]
async fn send_notification(
    app: AppHandle,
    data: String,
    title: &str,
    text: &str,
    image_path: &str,
) -> tauri::Result<()> {
    Toast::new("dev.huginn.desktop")
        .title(title)
        .text1(text)
        .sound(None)
        .duration(Duration::Short)
        .on_activated(move |_| {
            app.emit("notification-clicked", data.clone()).unwrap();
            // println!("Notification activated! {action:?}");
            Ok(())
        })
        //   .add_button("Test", "action222")
        .icon(&Path::new(image_path), IconCrop::Square, "alt")
        .show()
        .expect("unable to toast");

    Ok(())
}

async fn update(app: AppHandle, target: String) -> Result<(), tauri_plugin_updater::Error> {
    println!("Checking update...");

    let server_address = get_server_address(app.clone()).unwrap();
    let update_endpoint = format!(
        "{}/api/check-update/{{{{target}}}}/{{{{current_version}}}}",
        server_address
    );

    println!("{}", update_endpoint);

    if let Some(update) = app
        .updater_builder()
        .endpoints(vec![update_endpoint.parse().expect("Invalid URL")])?
        .version_comparator(|current, update| update.version != current)
        //   .version_comparator(|current, update| true)
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

fn get_server_address(app: AppHandle) -> Result<String, String> {
    let settings_path = app
        .path()
        .app_config_dir()
        .expect("could not resolve app_config_dir")
        .join("settings.json");

    let settings_data = fs::read_to_string(&settings_path)
        .map_err(|e| format!("failed to read settings.json: {}", e))?;

    let json: Value =
        serde_json::from_str(&settings_data).map_err(|e| format!("failed to pase JSON: {}", e))?;

    let server_address = json
        .get("serverAddress")
        .and_then(|v| v.as_str())
        .map(String::from)
        .ok_or("serverAddress not found or not a string".to_string());

    server_address
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|_app, argv, _cwd| {
            println!("a new app instance was opened with {argv:?} {_cwd:?} and the deep link event was already triggered");
         }));
    }

    builder = builder
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_cli::init())
        .invoke_handler(tauri::generate_handler![
            close_main,
            open_and_focus_main,
            splashscreen_mode,
            main_mode,
            check_update,
            send_notification
        ])
        .on_window_event(|window, event| match event {
            WindowEvent::Destroyed => {
                let windows = window.app_handle().webview_windows();

                for (_name, window) in windows.iter() {
                    window.close().unwrap();
                }
            }
            _ => {}
        })
        .setup(|app| {
            #[cfg(any(windows, target_os = "linux"))]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                app.deep_link().register_all()?;
            }

            #[cfg(desktop)]
            {
                use tauri_plugin_autostart::MacosLauncher;
                use tauri_plugin_autostart::ManagerExt;

                let _ = app.handle().plugin(tauri_plugin_autostart::init(
                    MacosLauncher::LaunchAgent,
                    Some(vec!["--silent"]),
                ));

                let autostart_manager = app.autolaunch();
                let _ = autostart_manager.enable();

                println!(
                    "registered for autostart? {}",
                    autostart_manager.is_enabled().unwrap()
                );
            }

            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&quit_item])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Huginn")
                .on_tray_icon_event(|tray, event| match event {
                    TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } => {
                        let app = tray.app_handle();

                        app.emit("tray-clicked", ()).unwrap();
                    }
                    _ => {}
                })
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .menu(&menu)
                .show_menu_on_left_click(false)
                .build(app)
                .expect("failed to create tray icon");

            Ok(())
        });

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
