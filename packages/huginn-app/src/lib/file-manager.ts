import type { AppSettings, VoicePreference } from "@/types";

export type FileMap = { "settings": AppSettings, "voice-preferences": VoicePreference[] }
export type FileType = keyof FileMap;

export async function loadFile<T extends FileType, I>(type: T, initial: I): Promise<FileMap[T] | I> {
   if (window.electronAPI) {
      if (!(await window.electronAPI.fileExists(type))) {
         return initial;
      }

      return await window.electronAPI.loadFile(type) as FileMap[T];
   }

   const item = localStorage.getItem(type);
   if (!item) {
      return initial;
   }

   return JSON.parse(item) as FileMap[T];
}

export async function saveFile<T extends FileType>(type: T, content: FileMap[T]) {
   if (window.electronAPI) {
      return await window.electronAPI.saveFile(type, content);
   }

   localStorage.setItem(type, JSON.stringify(content));
}

export async function fileExists<T extends FileType>(type: T) {
   if (window.electronAPI) {
      return await window.electronAPI.fileExists(type);
   }

   return !!localStorage.getItem(type)
}
