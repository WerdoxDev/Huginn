#pragma once
#include <windows.h>
#include <string>
#include <vector>

namespace icon_util
{
   struct IconResult
   {
      HICON hIcon = nullptr;
      bool ownsIcon = false; // true => caller must DestroyIcon(hIcon)
   };

   struct FindWindowData
   {
      DWORD pid;
      HWND result;
   };

   std::string Base64Encode(const std::vector<BYTE> &data);
   bool ExtractIconPixelsARGB(HICON hIcon, int &outWidth, int &outHeight, std::vector<BYTE> &outPixels);
   bool HIconToPngBytes(HICON hIcon, std::vector<BYTE> &outBytes);
   int GetEncoderClsid(const WCHAR *mimeType, CLSID *pClsid);
   BOOL CALLBACK EnumWindowsCallback(HWND hwnd, LPARAM lParam);
   HWND FindMainWindowForPID(DWORD pid);
   bool ExtractHBitmapPixelsBGRA(HBITMAP hBitmap, int &outWidth, int &outHeight, std::vector<BYTE> &outPixels);
   bool HBitmapToPngBytes(HBITMAP hBitmap, std::vector<BYTE> &outBytes);
   bool TryGetPackagedAppIconPngBytes(DWORD pid, std::vector<BYTE> &outBytes);
   IconResult GetIconForProcess(DWORD pid);
   bool GetProcessIconBase64(DWORD processId, std::string &outBase64);

}
