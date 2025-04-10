import path from "node:path";
import { fileURLToPath } from "node:url";
import { BrowserWindow, app } from "electron";
import log from "electron-log/main";
import { autoUpdater } from "electron-updater";

log.transports.file.level = "debug";
autoUpdater.logger = log;
autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.allowDowngrade = true;
autoUpdater.on("error", (e) => {
	log.error(e);
});
autoUpdater.on("update-not-available", (e) => {
	log.log("not available");
});
autoUpdater.on("checking-for-update", () => {
	log.log("CHECKING");
});
autoUpdater.on("update-cancelled", (e) => {
	log.log("cancel");
});
autoUpdater.on("login", (e) => {
	log.log("login?");
});
autoUpdater.on("update-available", (e) => {
	log.log("AVAILABLE!");
});
autoUpdater.on("download-progress", (e) => {
	log.log("download progress");
});

const _dirname = typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

function createWindow() {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: path.join(_dirname, "preload.js"),
		},
	});

	mainWindow.setMinimumSize(300, 300);
	mainWindow.setSize(300, 300);
	mainWindow.center();
	mainWindow.setResizable(false);

	if (process.env.VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
	} else {
		mainWindow.loadFile(path.join(_dirname, "../../dist/index.html"));
	}

	// Open the DevTools.
	mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
	const result = await autoUpdater.checkForUpdates();
	autoUpdater.quitAndInstall(true, true);
	log.log(result);
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
