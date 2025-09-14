#include <windows.h>
#include <shellapi.h>
#include <string>
#include <vector>
#include <gdiplus.h>
#include <iostream>
#include <fstream>

#pragma comment(lib, "shell32.lib")
#pragma comment(lib, "gdiplus.lib")

using namespace Gdiplus;

namespace icon_util
{
   std::string base64_encode(const std::vector<BYTE> &data)
   {
      const char *chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      std::string result;
      int val = 0;
      int valb = -6;

      for (BYTE c : data)
      {
         val = (val << 8) + c;
         valb += 8;
         while (valb >= 0)
         {
            result.push_back(chars[(val >> valb) & 0x3F]);
            valb -= 6;
         }
      }

      if (valb > -6)
      {
         result.push_back(chars[((val << 8) >> (valb + 8)) & 0x3F]);
      }

      while (result.size() % 4)
      {
         result.push_back('=');
      }

      return result;
   }

   struct WindowInfo
   {
      HWND hwnd;
      DWORD processId;
   };

   static BOOL CALLBACK EnumWindowsProc(HWND hwnd, LPARAM lParam)
   {
      std::vector<WindowInfo> *windows = reinterpret_cast<std::vector<WindowInfo> *>(lParam);

      if (!IsWindowVisible(hwnd))
         return TRUE;

      DWORD processId;
      GetWindowThreadProcessId(hwnd, &processId);

      wchar_t title[256] = {0};
      wchar_t className[256] = {0};
      GetWindowTextW(hwnd, title, sizeof(title) / sizeof(wchar_t));
      GetClassNameW(hwnd, className, sizeof(className) / sizeof(wchar_t));

      // Skip empty titles and system windows
      if (wcslen(title) > 0 && wcscmp(className, L"Shell_TrayWnd") != 0)
      {
         windows->push_back({hwnd, processId});
      }

      return TRUE;
   }

   HICON GetExeHICON(const std::wstring &exePath)
   {
      // Extract icon from executable
      HICON hIcon = ExtractIconW(GetModuleHandle(NULL), exePath.c_str(), 0);

      if (hIcon == NULL || hIcon == (HICON)1)
      {
         // Try alternative method using SHGetFileInfo
         SHFILEINFOW sfi = {};
         DWORD_PTR result = SHGetFileInfoW(exePath.c_str(), 0, &sfi, sizeof(sfi),
                                           SHGFI_ICON | SHGFI_LARGEICON);

         if (result != 0)
         {
            hIcon = sfi.hIcon;
         }
      }

      return hIcon;
   }

   HICON GetProcessHICON(DWORD processId)
   {
      std::vector<WindowInfo> windows;
      EnumWindows(EnumWindowsProc, reinterpret_cast<LPARAM>(&windows));

      HWND mainWindow = nullptr;
      for (const auto &window : windows)
      {
         if (window.processId == processId)
         {
            mainWindow = window.hwnd;
            break;
         }
      }

      if (!mainWindow)
      {
         return nullptr;
      }

      HICON hIcon = nullptr;

      // Method 1a: SendMessage WM_GETICON
      hIcon = (HICON)SendMessage(mainWindow, WM_GETICON, ICON_BIG, 0);
      if (hIcon)
      {
         return hIcon;
      }

      hIcon = (HICON)SendMessage(mainWindow, WM_GETICON, ICON_SMALL, 0);
      if (hIcon)
      {
         return hIcon;
      }

      // Method 1b: GetClassLongPtr
      hIcon = (HICON)GetClassLongPtr(mainWindow, GCLP_HICON);
      if (hIcon)
      {
         return hIcon;
      }

      hIcon = (HICON)GetClassLongPtr(mainWindow, GCLP_HICONSM);
      if (hIcon)
      {
         return hIcon;
      }

      return nullptr;
   }

   std::vector<BYTE> HICONToPngData(HICON hIcon)
   {
      std::vector<BYTE> pngData;

      if (!hIcon)
      {
         return pngData;
      }

      // Initialize GDI+
      Gdiplus::GdiplusStartupInput gdiplusStartupInput;
      ULONG_PTR gdiplusToken;
      if (Gdiplus::GdiplusStartup(&gdiplusToken, &gdiplusStartupInput, NULL) != Gdiplus::Ok)
      {
         return pngData;
      }

      // Get icon dimensions
      ICONINFO iconInfo;
      if (!GetIconInfo(hIcon, &iconInfo))
      {
         Gdiplus::GdiplusShutdown(gdiplusToken);
         return pngData;
      }

      BITMAP bmp;
      GetObject(iconInfo.hbmColor ? iconInfo.hbmColor : iconInfo.hbmMask, sizeof(BITMAP), &bmp);
      int width = bmp.bmWidth;
      int height = abs(bmp.bmHeight);

      // Create GDI+ bitmap with proper alpha channel
      Gdiplus::Bitmap *bitmap = new Gdiplus::Bitmap(width, height, PixelFormat32bppARGB);

      if (!bitmap || bitmap->GetLastStatus() != Gdiplus::Ok)
      {
         if (bitmap)
            delete bitmap;
         if (iconInfo.hbmColor)
            DeleteObject(iconInfo.hbmColor);
         if (iconInfo.hbmMask)
            DeleteObject(iconInfo.hbmMask);
         Gdiplus::GdiplusShutdown(gdiplusToken);
         return pngData;
      }

      // Create compatible DC for drawing with proper alpha handling
      HDC hdcScreen = GetDC(NULL);
      HDC hdcMem = CreateCompatibleDC(hdcScreen);

      // Create 32-bit DIB section for alpha channel preservation
      BITMAPINFO bmi = {0};
      bmi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
      bmi.bmiHeader.biWidth = width;
      bmi.bmiHeader.biHeight = -height; // Top-down DIB
      bmi.bmiHeader.biPlanes = 1;
      bmi.bmiHeader.biBitCount = 32;
      bmi.bmiHeader.biCompression = BI_RGB;

      void *pBits = nullptr;
      HBITMAP hBmp = CreateDIBSection(hdcMem, &bmi, DIB_RGB_COLORS, &pBits, NULL, 0);

      if (hBmp && pBits)
      {
         // Clear DIB with transparent background (all zeros = transparent)
         memset(pBits, 0, width * height * 4);

         HBITMAP hOldBmp = (HBITMAP)SelectObject(hdcMem, hBmp);

         // Draw icon with proper alpha blending
         DrawIconEx(hdcMem, 0, 0, hIcon, width, height, 0, NULL, DI_NORMAL);

         // Copy pixel data from DIB to GDI+ bitmap
         Gdiplus::BitmapData bitmapData;
         Gdiplus::Rect rect(0, 0, width, height);

         if (bitmap->LockBits(&rect, Gdiplus::ImageLockModeWrite, PixelFormat32bppARGB, &bitmapData) == Gdiplus::Ok)
         {
            // Direct memory copy from DIB to GDI+ bitmap
            BYTE *srcPtr = (BYTE *)pBits;
            BYTE *dstPtr = (BYTE *)bitmapData.Scan0;

            for (int y = 0; y < height; y++)
            {
               memcpy(dstPtr + y * bitmapData.Stride, srcPtr + y * width * 4, width * 4);
            }

            bitmap->UnlockBits(&bitmapData);

            // Create memory stream for PNG output
            IStream *stream = nullptr;
            if (CreateStreamOnHGlobal(NULL, TRUE, &stream) == S_OK && stream)
            {
               // Get PNG encoder CLSID
               CLSID pngClsid;
               if (CLSIDFromString(L"{557cf406-1a04-11d3-9a73-0000f81ef32e}", &pngClsid) == NOERROR)
               {
                  // Save bitmap as PNG
                  if (bitmap->Save(stream, &pngClsid) == Gdiplus::Ok)
                  {
                     // Get stream size and read data
                     STATSTG stats;
                     if (stream->Stat(&stats, STATFLAG_NONAME) == S_OK)
                     {
                        DWORD size = stats.cbSize.LowPart;
                        pngData.resize(size);

                        LARGE_INTEGER li = {0};
                        stream->Seek(li, STREAM_SEEK_SET, NULL);

                        DWORD bytesRead = 0;
                        stream->Read(pngData.data(), size, &bytesRead);

                        if (bytesRead != size)
                        {
                           pngData.clear(); // Failed to read complete data
                        }
                     }
                  }
               }
               stream->Release();
            }
         }

         // Cleanup DIB resources
         SelectObject(hdcMem, hOldBmp);
         DeleteObject(hBmp);
      }

      // Cleanup GDI resources
      DeleteDC(hdcMem);
      ReleaseDC(NULL, hdcScreen);

      // Cleanup icon info
      if (iconInfo.hbmColor)
         DeleteObject(iconInfo.hbmColor);
      if (iconInfo.hbmMask)
         DeleteObject(iconInfo.hbmMask);

      // Cleanup GDI+ resources
      delete bitmap;
      Gdiplus::GdiplusShutdown(gdiplusToken);

      return pngData;
   }

   std::string GetExeIconBase64(const std::wstring &exePath)
   {
      HICON hIcon = GetExeHICON(exePath);
      std::vector<BYTE> pngData = HICONToPngData(hIcon);

      DestroyIcon(hIcon);

      if (pngData.empty())
      {
         return "";
      }

      return "data:image/png;base64," + base64_encode(pngData);
   }

   std::string GetPngFileBase64(const std::wstring pngPath)
   {
      std::wcout << pngPath << std::endl;
      // Step 1: Read file into memory
      std::ifstream file(pngPath, std::ios::binary | std::ios::ate);
      if (!file)
      {
         std::error_code ec(errno, std::system_category());
         std::cerr << "Error opening file: " << ec.message() << std::endl;
         return "";
      }

      std::streamsize size = file.tellg();
      file.seekg(0, std::ios::beg);

      std::vector<BYTE> buffer(size);
      if (!file.read(reinterpret_cast<char *>(buffer.data()), size))
      {
         return "";
      }

      return "data:image/png;base64," + base64_encode(buffer);
   }

   std::string GetProcessIconBase64(DWORD processId)
   {
      HICON hIcon = icon_util::GetProcessHICON(processId);
      std::vector<BYTE> pngData = icon_util::HICONToPngData(hIcon);

      DestroyIcon(hIcon);

      if (pngData.empty())
      {
         return "";
      }

      return "data:image/png;base64," + base64_encode(pngData);
   }
}
