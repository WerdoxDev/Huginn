#include "icon_util.h"
#include <windows.h>
#include <shellapi.h>
#include <string>
#include <vector>
#include <gdiplus.h>
#include <shobjidl.h> // IShellItemImageFactory, SHCreateItemFromParsingName
#include <appmodel.h> // GetApplicationUserModelId
#include <iostream>
#include <fstream>

#pragma comment(lib, "shell32.lib")
#pragma comment(lib, "gdiplus.lib")
#pragma comment(lib, "Psapi.lib")
#pragma comment(lib, "Ole32.lib")

using namespace Gdiplus;

static const char kB64Table[] =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "abcdefghijklmnopqrstuvwxyz"
    "0123456789+/";

namespace icon_util
{

   std::string Base64Encode(const std::vector<BYTE> &data)
   {
      std::string out;
      out.reserve(((data.size() + 2) / 3) * 4);
      size_t i = 0;
      const size_t n = data.size();

      while (i + 3 <= n)
      {
         BYTE b0 = data[i], b1 = data[i + 1], b2 = data[i + 2];
         out.push_back(kB64Table[b0 >> 2]);
         out.push_back(kB64Table[((b0 & 0x3) << 4) | (b1 >> 4)]);
         out.push_back(kB64Table[((b1 & 0xF) << 2) | (b2 >> 6)]);
         out.push_back(kB64Table[b2 & 0x3F]);
         i += 3;
      }

      const size_t rem = n - i;
      if (rem == 1)
      {
         BYTE b0 = data[i];
         out.push_back(kB64Table[b0 >> 2]);
         out.push_back(kB64Table[(b0 & 0x3) << 4]);
         out.push_back('=');
         out.push_back('=');
      }
      else if (rem == 2)
      {
         BYTE b0 = data[i], b1 = data[i + 1];
         out.push_back(kB64Table[b0 >> 2]);
         out.push_back(kB64Table[((b0 & 0x3) << 4) | (b1 >> 4)]);
         out.push_back(kB64Table[(b1 & 0xF) << 2]);
         out.push_back('=');
      }
      return out;
   }

   bool ExtractIconPixelsARGB(HICON hIcon, int &outWidth, int &outHeight, std::vector<BYTE> &outPixels)
   {
      ICONINFO iconInfo{};
      if (!GetIconInfo(hIcon, &iconInfo))
         return false;

      // RAII-ish cleanup for the two bitmaps GetIconInfo hands us.
      auto cleanup = [&iconInfo]()
      {
         if (iconInfo.hbmColor)
            DeleteObject(iconInfo.hbmColor);
         if (iconInfo.hbmMask)
            DeleteObject(iconInfo.hbmMask);
      };

      BITMAP bmpColor{};
      if (!GetObject(iconInfo.hbmColor, sizeof(bmpColor), &bmpColor))
      {
         cleanup();
         return false;
      }

      const int width = bmpColor.bmWidth;
      const int height = bmpColor.bmHeight;
      if (width <= 0 || height <= 0)
      {
         cleanup();
         return false;
      }

      HDC hdc = GetDC(nullptr);
      if (!hdc)
      {
         cleanup();
         return false;
      }

      BITMAPINFO bmi{};
      bmi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
      bmi.bmiHeader.biWidth = width;
      bmi.bmiHeader.biHeight = -height; // negative = top-down, avoids row flipping
      bmi.bmiHeader.biPlanes = 1;
      bmi.bmiHeader.biBitCount = 32;
      bmi.bmiHeader.biCompression = BI_RGB;

      std::vector<BYTE> colorBits(static_cast<size_t>(width) * height * 4);
      if (!GetDIBits(hdc, iconInfo.hbmColor, 0, height, colorBits.data(), &bmi, DIB_RGB_COLORS))
      {
         ReleaseDC(nullptr, hdc);
         cleanup();
         return false;
      }

      // Does the color bitmap already carry a genuine alpha channel?
      bool hasRealAlpha = false;
      for (size_t i = 3; i < colorBits.size(); i += 4)
      {
         if (colorBits[i] != 0)
         {
            hasRealAlpha = true;
            break;
         }
      }

      if (!hasRealAlpha)
      {
         // Legacy icon: derive alpha from the 1bpp AND mask
         // (mask bit 1 = transparent, 0 = opaque). Mask rows are
         // DWORD-aligned, hence the manual stride calculation.
         BITMAPINFO maskInfo{};
         maskInfo.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
         maskInfo.bmiHeader.biWidth = width;
         maskInfo.bmiHeader.biHeight = -height;
         maskInfo.bmiHeader.biPlanes = 1;
         maskInfo.bmiHeader.biBitCount = 1;
         maskInfo.bmiHeader.biCompression = BI_RGB;

         const int maskStride = ((width + 31) / 32) * 4;
         std::vector<BYTE> maskBits(static_cast<size_t>(maskStride) * height);

         if (GetDIBits(hdc, iconInfo.hbmMask, 0, height, maskBits.data(), &maskInfo, DIB_RGB_COLORS))
         {
            for (int y = 0; y < height; ++y)
            {
               const BYTE *maskRow = maskBits.data() + static_cast<size_t>(y) * maskStride;
               BYTE *colorRow = colorBits.data() + static_cast<size_t>(y) * width * 4;
               for (int x = 0; x < width; ++x)
               {
                  const bool transparent = (maskRow[x / 8] >> (7 - (x % 8))) & 1;
                  BYTE *px = colorRow + static_cast<size_t>(x) * 4; // B, G, R, A
                  px[3] = transparent ? 0 : 255;
                  if (transparent)
                  {
                     // Zero the color too, so no dark fringe shows through
                     // if anything ever composites this ignoring alpha.
                     px[0] = px[1] = px[2] = 0;
                  }
               }
            }
         }
         else
         {
            // Couldn't read the mask - treat as fully opaque rather than
            // silently producing a black image.
            for (size_t i = 3; i < colorBits.size(); i += 4)
               colorBits[i] = 255;
         }
      }

      ReleaseDC(nullptr, hdc);
      cleanup();

      outWidth = width;
      outHeight = height;
      outPixels = std::move(colorBits);
      return true;
   }

   bool HIconToPngBytes(HICON hIcon, std::vector<BYTE> &outBytes)
   {
      int width = 0, height = 0;
      std::vector<BYTE> pixels;
      if (!ExtractIconPixelsARGB(hIcon, width, height, pixels))
         return false;

      const int stride = width * 4;
      Bitmap bitmap(width, height, stride, PixelFormat32bppARGB, pixels.data());
      if (bitmap.GetLastStatus() != Ok)
         return false;

      IStream *stream = nullptr;
      if (CreateStreamOnHGlobal(nullptr, TRUE, &stream) != S_OK)
         return false;

      CLSID pngClsid;
      if (GetEncoderClsid(L"image/png", &pngClsid) != 0)
      {
         stream->Release();
         return false;
      }

      if (bitmap.Save(stream, &pngClsid, nullptr) != Ok)
      {
         stream->Release();
         return false;
      }

      HGLOBAL hGlobal = nullptr;
      if (GetHGlobalFromStream(stream, &hGlobal) != S_OK)
      {
         stream->Release();
         return false;
      }

      SIZE_T size = GlobalSize(hGlobal);
      void *data = GlobalLock(hGlobal);
      if (data)
      {
         outBytes.assign(static_cast<BYTE *>(data), static_cast<BYTE *>(data) + size);
         GlobalUnlock(hGlobal);
      }

      stream->Release();
      return !outBytes.empty();
   }

   int GetEncoderClsid(const WCHAR *mimeType, CLSID *pClsid)
   {
      UINT numEncoders = 0, size = 0;
      GetImageEncodersSize(&numEncoders, &size);
      if (size == 0)
         return -1;

      std::vector<BYTE> buffer(size);
      auto *codecInfo = reinterpret_cast<ImageCodecInfo *>(buffer.data());
      GetImageEncoders(numEncoders, size, codecInfo);

      for (UINT i = 0; i < numEncoders; ++i)
      {
         if (wcscmp(codecInfo[i].MimeType, mimeType) == 0)
         {
            *pClsid = codecInfo[i].Clsid;
            return 0;
         }
      }
      return -1;
   }

   BOOL CALLBACK EnumWindowsCallback(HWND hwnd, LPARAM lParam)
   {
      auto *data = reinterpret_cast<FindWindowData *>(lParam);

      DWORD windowPid = 0;
      GetWindowThreadProcessId(hwnd, &windowPid);
      if (windowPid != data->pid)
         return TRUE;

      if (!IsWindowVisible(hwnd))
         return TRUE;
      if (GetWindow(hwnd, GW_OWNER) != nullptr)
         return TRUE; // skip owned/child-ish windows

      data->result = hwnd;
      return FALSE; // found it, stop enumerating
   }

   HWND FindMainWindowForPID(DWORD pid)
   {
      FindWindowData data{pid, nullptr};
      EnumWindows(EnumWindowsCallback, reinterpret_cast<LPARAM>(&data));
      return data.result;
   }

   bool ExtractHBitmapPixelsBGRA(HBITMAP hBitmap, int &outWidth, int &outHeight, std::vector<BYTE> &outPixels)
   {
      BITMAP bmp{};
      if (!GetObject(hBitmap, sizeof(bmp), &bmp))
         return false;

      const int width = bmp.bmWidth;
      const int height = bmp.bmHeight;
      if (width <= 0 || height <= 0)
         return false;

      HDC hdc = GetDC(nullptr);
      if (!hdc)
         return false;

      BITMAPINFO bmi{};
      bmi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
      bmi.bmiHeader.biWidth = width;
      bmi.bmiHeader.biHeight = -height; // top-down
      bmi.bmiHeader.biPlanes = 1;
      bmi.bmiHeader.biBitCount = 32;
      bmi.bmiHeader.biCompression = BI_RGB;

      std::vector<BYTE> bits(static_cast<size_t>(width) * height * 4);
      const bool ok = GetDIBits(hdc, hBitmap, 0, height, bits.data(), &bmi, DIB_RGB_COLORS) != 0;
      ReleaseDC(nullptr, hdc);
      if (!ok)
         return false;

      outWidth = width;
      outHeight = height;
      outPixels = std::move(bits);
      return true;
   }

   bool HBitmapToPngBytes(HBITMAP hBitmap, std::vector<BYTE> &outBytes)
   {
      int width = 0, height = 0;
      std::vector<BYTE> pixels;
      if (!ExtractHBitmapPixelsBGRA(hBitmap, width, height, pixels))
         return false;

      bool hasAlpha = false;
      for (size_t i = 3; i < pixels.size(); i += 4)
      {
         if (pixels[i] != 0)
         {
            hasAlpha = true;
            break;
         }
      }

      const int stride = width * 4;
      // If there's no alpha data at all, treat as opaque; otherwise tell GDI+
      // this buffer is premultiplied so it un-premultiplies on encode.
      // PixelFormat format = hasAlpha ? PixelFormat32bppPARGB : PixelFormat32bppRGB;
      PixelFormat format = PixelFormat32bppARGB;
      Bitmap bitmap(width, height, stride, format, pixels.data());
      if (bitmap.GetLastStatus() != Ok)
         return false;

      IStream *stream = nullptr;
      if (CreateStreamOnHGlobal(nullptr, TRUE, &stream) != S_OK)
         return false;

      CLSID pngClsid;
      if (GetEncoderClsid(L"image/png", &pngClsid) != 0)
      {
         stream->Release();
         return false;
      }

      if (bitmap.Save(stream, &pngClsid, nullptr) != Ok)
      {
         stream->Release();
         return false;
      }

      HGLOBAL hGlobal = nullptr;
      if (GetHGlobalFromStream(stream, &hGlobal) != S_OK)
      {
         stream->Release();
         return false;
      }

      SIZE_T size = GlobalSize(hGlobal);
      void *data = GlobalLock(hGlobal);
      if (data)
      {
         outBytes.assign(static_cast<BYTE *>(data), static_cast<BYTE *>(data) + size);
         GlobalUnlock(hGlobal);
      }

      stream->Release();
      return !outBytes.empty();
   }

   bool TryGetPackagedAppIconPngBytes(DWORD pid, std::vector<BYTE> &outBytes)
   {
      HANDLE hProcess = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, pid);
      if (!hProcess)
         return false;

      UINT32 aumidLen = 0;
      LONG rc = GetApplicationUserModelId(hProcess, &aumidLen, nullptr);
      if (rc != ERROR_INSUFFICIENT_BUFFER || aumidLen == 0)
      {
         // Not a packaged app (or no AUMID) - nothing to do here.
         CloseHandle(hProcess);
         return false;
      }

      // Use a vector<wchar_t> rather than wstring: vector::data() has always
      // been mutable (no C++17 requirement), and there's no ambiguity about
      // where the buffer starts or how the null terminator is handled.
      std::vector<wchar_t> aumidBuf(aumidLen, L'\0');
      rc = GetApplicationUserModelId(hProcess, &aumidLen, aumidBuf.data());
      CloseHandle(hProcess);
      if (rc != ERROR_SUCCESS)
         return false;

      // aumidBuf is null-terminated by the API; build the wstring from that.
      std::wstring aumid(aumidBuf.data());
      if (aumid.empty())
         return false;

      std::wstring parsingPath = L"shell:AppsFolder\\" + aumid;

      IShellItem *shellItem = nullptr;
      HRESULT hr = SHCreateItemFromParsingName(parsingPath.c_str(), nullptr,
                                               IID_PPV_ARGS(&shellItem));
      if (FAILED(hr) || !shellItem)
         return false;

      bool ok = false;
      IShellItemImageFactory *imageFactory = nullptr;
      hr = shellItem->QueryInterface(IID_PPV_ARGS(&imageFactory));
      if (SUCCEEDED(hr) && imageFactory)
      {
         HBITMAP hBitmap = nullptr;
         SIZE size = {72, 72}; // ask for a large icon; shrink client-side if needed
         hr = imageFactory->GetImage(size, SIIGBF_ICONONLY | SIIGBF_BIGGERSIZEOK | SIIGBF_SCALEUP, &hBitmap);
         if (SUCCEEDED(hr) && hBitmap)
         {
            ok = HBitmapToPngBytes(hBitmap, outBytes);
            DeleteObject(hBitmap);
         }
         imageFactory->Release();
      }

      shellItem->Release();
      return ok;
   }

   IconResult GetIconForProcess(DWORD pid)
   {
      IconResult result;

      // Resolve the exe path (needed for the fallback path, and useful in general)
      std::wstring exePath;
      HANDLE hProcess = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, pid);
      if (hProcess)
      {
         WCHAR path[MAX_PATH];
         DWORD size = MAX_PATH;
         if (QueryFullProcessImageNameW(hProcess, 0, path, &size))
         {
            exePath.assign(path, size);
         }
         CloseHandle(hProcess);
      }

      // Preferred: ask the process's own window for its icon. This reflects
      // what the app is actually showing (title bar / taskbar), which can
      // differ from the exe's embedded icon (e.g. Electron apps, hosts, etc).
      if (HWND hwnd = FindMainWindowForPID(pid))
      {
         HICON hIcon = nullptr;

         SendMessageTimeout(hwnd, WM_GETICON, ICON_BIG, 0,
                            SMTO_ABORTIFHUNG, 200, (PDWORD_PTR)&hIcon);
         if (!hIcon)
         {
            SendMessageTimeout(hwnd, WM_GETICON, ICON_SMALL2, 0,
                               SMTO_ABORTIFHUNG, 200, (PDWORD_PTR)&hIcon);
         }
         if (!hIcon)
         {
            hIcon = reinterpret_cast<HICON>(GetClassLongPtrW(hwnd, GCLP_HICON));
         }
         if (!hIcon)
         {
            hIcon = reinterpret_cast<HICON>(GetClassLongPtrW(hwnd, GCLP_HICONSM));
         }

         if (hIcon)
         {
            // Icons obtained this way are owned by the window/class -
            // do NOT destroy them.
            result.hIcon = hIcon;
            result.ownsIcon = false;
            return result;
         }
      }

      // Fallback: extract the icon embedded in the executable file itself.
      // This works even for processes with no window (services, background apps).
      if (!exePath.empty())
      {
         HICON hIcon = nullptr;
         UINT n = ExtractIconExW(exePath.c_str(), 0, &hIcon, nullptr, 1);
         if (n > 0 && hIcon)
         {
            result.hIcon = hIcon;
            result.ownsIcon = true; // caller must DestroyIcon this one
         }
      }

      return result;
   }

   bool GetProcessIconBase64(DWORD processId, std::string &outBase64)
   {
      HRESULT hrCom = CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED);
      bool comInitialized = SUCCEEDED(hrCom);

      GdiplusStartupInput gdiplusStartupInput;
      ULONG_PTR gdiplusToken;
      GdiplusStartup(&gdiplusToken, &gdiplusStartupInput, nullptr);

      std::string base64;
      std::vector<BYTE> pngBytes;

      if (TryGetPackagedAppIconPngBytes(processId, pngBytes))
      {
         outBase64 = Base64Encode(pngBytes);
         return true;
      }

      IconResult icon = GetIconForProcess(processId);
      if (!icon.hIcon)
         return false;

      pngBytes.clear();
      bool ok = HIconToPngBytes(icon.hIcon, pngBytes);

      if (icon.ownsIcon)
      {
         DestroyIcon(icon.hIcon);
      }

      if (!ok)
         return false;

      outBase64 = icon_util::Base64Encode(pngBytes);

      GdiplusShutdown(gdiplusToken);
      if (comInitialized)
      {
         CoUninitialize();
      }
      return true;
   }
}
