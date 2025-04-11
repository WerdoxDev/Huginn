import { access, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AppSettings } from "@stores/settingsStore";
import { BrowserWindow, Menu, Notification, Tray, app, ipcMain, shell } from "electron";
import log from "electron-log/main";
import { CancellationToken, autoUpdater } from "electron-updater";

const _dirname = typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

configureUpdater();

if (process.defaultApp) {
	if (process.argv.length >= 2) {
		app.setAsDefaultProtocolClient("huginn", process.execPath, [path.resolve(process.argv[1])]);
	}
} else {
	app.setAsDefaultProtocolClient("huginn");
}

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
	app.exit();
}

function createWindow() {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		minWidth: 1200,
		minHeight: 670,
		titleBarStyle: "hidden",
		webPreferences: {
			contextIsolation: true,
			preload: path.join(_dirname, "preload.cjs"),
		},
		show: false,
	});

	if (process.env.VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
	} else {
		mainWindow.loadFile(path.join(_dirname, "../../dist/index.html"));
	}

	// Open the DevTools.
	mainWindow.webContents.openDevTools({ mode: "undocked" });

	eventListeners(mainWindow);
	configureTray(mainWindow);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
	// autoUpdater.quitAndInstall(true, true);
	if (!gotLock) {
		return;
	}

	createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

function configureUpdater() {
	autoUpdater.logger = log;
	autoUpdater.autoInstallOnAppQuit = false;
	autoUpdater.allowDowngrade = true;
	autoUpdater.autoDownload = false;

	autoUpdater.on("error", (e) => {
		log.error("UPDATE ERROR", e);
	});

	autoUpdater.on("update-not-available", (e) => {
		log.log("NOT AVAILABLE");
	});

	autoUpdater.on("checking-for-update", () => {
		log.log("CHECKING");
	});

	autoUpdater.on("update-cancelled", (e) => {
		log.log("cancel");
	});

	autoUpdater.on("update-available", (e) => {
		log.log("AVAILABLE!");
	});

	autoUpdater.on("update-downloaded", (e) => {
		log.log("DOWNLOADED");
		autoUpdater.quitAndInstall(true, true);
	});
}

function configureTray(mainWindow: BrowserWindow) {
	console.log("TRAY");
	const tray = new Tray(app.isPackaged ? path.join(process.resourcesPath, "assets", "icon.ico") : "./assets/icon.ico");
	const contextMenu = Menu.buildFromTemplate([
		{
			label: "Quit",
			type: "normal",
			click: () => {
				app.exit();
			},
		},
	]);

	tray.setContextMenu(contextMenu);
	tray.setToolTip("Huginn");

	tray.on("click", () => {
		mainWindow.show();
	});
}

function eventListeners(mainWindow: BrowserWindow) {
	mainWindow.on("close", (e) => {
		e.preventDefault();
		mainWindow.hide();
	});

	ipcMain.handle("window:version", () => app.getVersion());

	ipcMain.on("window:splashscreen-mode", () => {
		mainWindow.setMinimumSize(300, 300);
		mainWindow.setSize(300, 300);
		mainWindow.center();
		mainWindow.setResizable(false);
	});

	ipcMain.on("window:main-mode", () => {
		mainWindow.setResizable(true);
		mainWindow.setMinimumSize(1200, 670);
		mainWindow.setSize(1200, 670);
		mainWindow.center();
	});

	ipcMain.on("window:show-main", () => mainWindow.show());
	ipcMain.on("window:hide-main", () => mainWindow.hide());
	ipcMain.on("window:focus-main", () => mainWindow.focus());
	ipcMain.on("window:minimize", () => mainWindow.minimize());
	ipcMain.on("window:toggle-maximize", () => (mainWindow.isMaximized() ? mainWindow.restore() : mainWindow.maximize()));

	ipcMain.handle("update:check", async () => {
		const result = await autoUpdater.checkForUpdates();
		return result?.updateInfo;
	});

	ipcMain.on("update:download", async () => {
		const cancel = new CancellationToken();
		await autoUpdater.downloadUpdate(cancel);
	});

	autoUpdater.on("download-progress", (e) => {
		mainWindow.webContents.send("update:progress", e);
	});

	ipcMain.handle("cli:get-args", () => process.argv);

	app.on("second-instance", (event, commandLine, workingDirectory, additionalData) => {
		const cmd = commandLine.pop();

		if (cmd?.startsWith("huginn://")) {
			mainWindow.webContents.send("cli:deep-link", cmd);
		}

		mainWindow.show();
		mainWindow.focus();
	});

	ipcMain.on("shell:open-external", (_, url: string) => {
		shell.openExternal(url);
	});

	ipcMain.on("notification:send", (_, data: { title: string; body: string; payload?: string }) => {
		const notification = new Notification({
			title: data.title,
			body: data.body,
			icon: app.isPackaged ? path.join(process.resourcesPath, "assets", "icon.ico") : "./assets/icon.ico",
			silent: true,
		});

		notification.on("click", () => {
			console.log(data.payload);
			mainWindow.webContents.send("notification:clicked", data.payload);
		});

		notification.show();
	});

	const settingsPath = path.join(app.getPath("userData"), "settings.json");
	ipcMain.handle("settings:load", async () => {
		try {
			const fileContent = await readFile(settingsPath, { encoding: "utf-8" });
			return JSON.parse(fileContent);
		} catch (e) {
			console.log("Error reading settings file:", e);
			return {};
		}
	});

	ipcMain.handle("settings:save", async (_, settings: string) => {
		try {
			await writeFile(settingsPath, JSON.stringify(JSON.parse(settings), null, 2));
		} catch (e) {
			console.log("Error writing settings file:", e);
		}
	});

	ipcMain.handle("settings:try-save-default", async (_, settings: string) => {
		try {
			if (await fileExists(settingsPath)) {
				return;
			}

			await writeFile(settingsPath, JSON.stringify(JSON.parse(settings), null, 2));
		} catch (e) {
			console.log("Error writing settings file:", e);
		}
	});
}

async function fileExists(path: string) {
	try {
		await access(path);
		return true;
	} catch (e) {
		return false;
	}
}
