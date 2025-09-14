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

      // Initialize GDI+
      Gdiplus::GdiplusStartupInput gdiplusStartupInput;
      ULONG_PTR gdiplusToken;
      if (Gdiplus::GdiplusStartup(&gdiplusToken, &gdiplusStartupInput, NULL) != Gdiplus::Ok)
         return pngData;

      // Get icon info
      ICONINFO iconInfo;
      if (!GetIconInfo(hIcon, &iconInfo))
      {
         Gdiplus::GdiplusShutdown(gdiplusToken);
         return pngData;
      }

      // RAII wrapper for cleanup
      struct Cleanup
      {
         HBITMAP hbmColor, hbmMask;
         ULONG_PTR token;
         ~Cleanup()
         {
            if (hbmColor)
               DeleteObject(hbmColor);
            if (hbmMask)
               DeleteObject(hbmMask);
            Gdiplus::GdiplusShutdown(token);
         }
      } cleanup = {iconInfo.hbmColor, iconInfo.hbmMask, gdiplusToken};

      // Get bitmap dimensions
      BITMAP bmp;
      if (!GetObject(iconInfo.hbmColor ? iconInfo.hbmColor : iconInfo.hbmMask, sizeof(BITMAP), &bmp))
         return pngData;

      const int width = bmp.bmWidth;
      const int height = iconInfo.hbmColor ? bmp.bmHeight : bmp.bmHeight / 2;
      const int pixelCount = width * height;
      const int stride = width * 4;

      // Create device contexts with RAII cleanup
      HDC hdcScreen = GetDC(NULL);
      if (!hdcScreen)
         return pngData;

      HDC hdcMem = CreateCompatibleDC(hdcScreen);
      if (!hdcMem)
      {
         ReleaseDC(NULL, hdcScreen);
         return pngData;
      }

      // Create a 32-bit DIB for the icon
      BITMAPINFO bmi = {};
      bmi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
      bmi.bmiHeader.biWidth = width;
      bmi.bmiHeader.biHeight = -height; // Top-down DIB
      bmi.bmiHeader.biPlanes = 1;
      bmi.bmiHeader.biBitCount = 32;
      bmi.bmiHeader.biCompression = BI_RGB;

      BYTE *pBits = nullptr;
      HBITMAP hBitmap = CreateDIBSection(hdcMem, &bmi, DIB_RGB_COLORS, (void **)&pBits, NULL, 0);

      bool success = false;
      if (hBitmap && pBits)
      {
         HBITMAP hOldBitmap = (HBITMAP)SelectObject(hdcMem, hBitmap);

         // Clear to transparent
         ZeroMemory(pBits, stride * height);

         // Draw the icon
         if (DrawIconEx(hdcMem, 0, 0, hIcon, width, height, 0, NULL, DI_NORMAL))
         {
            DWORD *pixels = (DWORD *)pBits;

            // Check if icon has proper alpha channel
            bool hasAlphaChannel = false;
            for (int i = 0; i < pixelCount; i++)
            {
               BYTE alpha = (pixels[i] >> 24) & 0xFF;
               if (alpha > 0 && alpha < 255)
               {
                  hasAlphaChannel = true;
                  break;
               }
            }

            // Apply mask-based transparency if no alpha channel detected
            if (!hasAlphaChannel && iconInfo.hbmMask)
            {
               HDC hdcMask = CreateCompatibleDC(hdcScreen);
               if (hdcMask)
               {
                  BYTE *maskBits = nullptr;
                  HBITMAP hMaskBitmap = CreateDIBSection(hdcMask, &bmi, DIB_RGB_COLORS, (void **)&maskBits, NULL, 0);

                  if (hMaskBitmap && maskBits)
                  {
                     HBITMAP hOldMask = (HBITMAP)SelectObject(hdcMask, hMaskBitmap);

                     HDC hdcOrigMask = CreateCompatibleDC(hdcScreen);
                     if (hdcOrigMask)
                     {
                        HBITMAP hOldOrigMask = (HBITMAP)SelectObject(hdcOrigMask, iconInfo.hbmMask);

                        if (BitBlt(hdcMask, 0, 0, width, height, hdcOrigMask, 0, 0, SRCCOPY))
                        {
                           // Apply mask: black pixels in mask = opaque, white = transparent
                           DWORD *maskPixels = (DWORD *)maskBits;
                           for (int i = 0; i < pixelCount; i++)
                           {
                              BYTE maskValue = maskPixels[i] & 0xFF;
                              BYTE alpha = (maskValue == 0) ? 255 : 0;
                              pixels[i] = (pixels[i] & 0x00FFFFFF) | (alpha << 24);
                           }
                           success = true;
                        }

                        SelectObject(hdcOrigMask, hOldOrigMask);
                        DeleteDC(hdcOrigMask);
                     }

                     SelectObject(hdcMask, hOldMask);
                     DeleteObject(hMaskBitmap);
                  }
                  DeleteDC(hdcMask);
               }
            }
            else
            {
               // Clean up zero-alpha pixels for icons with alpha channel
               for (int i = 0; i < pixelCount; i++)
               {
                  if ((pixels[i] & 0xFF000000) == 0)
                     pixels[i] = 0;
               }
               success = true;
            }

            // Create GDI+ bitmap and save to PNG
            if (success)
            {
               Gdiplus::Bitmap bitmap(width, height, stride, PixelFormat32bppARGB, pBits);

               if (bitmap.GetLastStatus() == Gdiplus::Ok)
               {
                  IStream *stream = nullptr;
                  if (SUCCEEDED(CreateStreamOnHGlobal(NULL, TRUE, &stream)))
                  {
                     // Use pre-defined PNG CLSID
                     static const CLSID pngClsid = {0x557cf406, 0x1a04, 0x11d3, {0x9a, 0x73, 0x00, 0x00, 0xf8, 0x1e, 0xf3, 0x2e}};

                     if (bitmap.Save(stream, &pngClsid) == Gdiplus::Ok)
                     {
                        STATSTG stats;
                        if (SUCCEEDED(stream->Stat(&stats, STATFLAG_NONAME)) && stats.cbSize.HighPart == 0)
                        {
                           DWORD size = stats.cbSize.LowPart;
                           pngData.resize(size);

                           LARGE_INTEGER zero = {};
                           if (SUCCEEDED(stream->Seek(zero, STREAM_SEEK_SET, NULL)))
                           {
                              DWORD bytesRead;
                              stream->Read(pngData.data(), size, &bytesRead);
                           }
                        }
                     }
                     stream->Release();
                  }
               }
            }
         }

         SelectObject(hdcMem, hOldBitmap);
         DeleteObject(hBitmap);
      }

      DeleteDC(hdcMem);
      ReleaseDC(NULL, hdcScreen);

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
