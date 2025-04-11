import { version } from "../package.json";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = "WerdoxDev";
const REPO = "Huginn";
const TAG = `app@v${version}`;

const FILES = [
	{
		path: `./dist/electron/Huginn_${version}_x64-setup.exe`,
		name: `Huginn_${version}_x64-setup.exe`,
		type: "application/octet-stream",
	},
	{
		path: `./dist/electron/Huginn_${version}_x64-setup.exe.blockmap`,
		name: `Huginn_${version}_x64-setup.exe.blockmap`,
		type: "application/octet-stream",
	},
	{
		path: "./dist/electron/latest.yml",
		name: "latest.yml",
		type: "text/yaml",
	},
];

async function getReleaseByTag() {
	const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/tags/${TAG}`, {
		headers: {
			Authorization: `Bearer ${GITHUB_TOKEN}`,
			Accept: "application/vnd.github+json",
		},
	});

	if (!res.ok) {
		throw new Error(`Failed to get release: ${res.statusText}`);
	}

	const release = await res.json();
	return release;
}

async function uploadAsset(uploadUrl: string) {
	for (const file of FILES) {
		const fileBuffer = await Bun.file(file.path).arrayBuffer();
		const finalUrl = `${uploadUrl.replace(/\{\?name,label\}/, "")}?name=${encodeURIComponent(file.name)}`;

		console.log(fileBuffer.byteLength, finalUrl);

		const res = await fetch(finalUrl, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${GITHUB_TOKEN}`,
				"Content-Type": file.type,
				"Content-Length": fileBuffer.byteLength.toString(),
			},
			body: fileBuffer,
		});

		if (!res.ok) {
			throw new Error(`Failed to upload asset: ${res.statusText}`);
		}

		const data = await res.json();
		console.log("Asset uploaded:", data.browser_download_url);
	}
}

try {
	const release = await getReleaseByTag();
	await uploadAsset(release.upload_url);
} catch (err) {
	console.error("Error:", err);
}
