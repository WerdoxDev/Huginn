#include "screen_util.h"
#include "image_util.h"
#include <windows.h>
#include <string>
#include <vector>
#include <iostream>
#include <gdiplus.h>

#pragma comment(lib, "gdiplus.lib")

namespace screen_util
{
   BOOL CALLBACK MonitorEnumProc(HMONITOR hMonitor, HDC, LPRECT lprcMonitor, LPARAM lParam)
   {
      auto *monitors = reinterpret_cast<std::vector<MonitorInfo> *>(lParam);

      MONITORINFOEXW mi{};
      mi.cbSize = sizeof(mi);
      GetMonitorInfoW(hMonitor, &mi);

      MonitorInfo info;
      info.hMonitor = hMonitor;
      info.bounds = *lprcMonitor;
      info.isPrimary = (mi.dwFlags & MONITORINFOF_PRIMARY) != 0;

      monitors->push_back(info);
      return TRUE;
   }

   std::vector<MonitorInfo> EnumerateMonitors()
   {
      std::vector<MonitorInfo> monitors;
      EnumDisplayMonitors(nullptr, nullptr, MonitorEnumProc, reinterpret_cast<LPARAM>(&monitors));
      return monitors;
   }

   const MonitorInfo *FindMonitorByBounds(const std::vector<MonitorInfo> &monitors, const RECT &bounds, int tolerancePx)
   {
      auto close = [tolerancePx](LONG a, LONG b)
      { return std::abs((long)(a - b)) <= tolerancePx; };

      for (const auto &m : monitors)
      {
         std::cout << "Checking monitor: " << m.hMonitor << " bounds: (" << m.bounds.left << ", " << m.bounds.top
                   << ", " << m.bounds.right << ", " << m.bounds.bottom << ")" << std::endl;
         std::cout << "Against requested bounds: (" << bounds.left << ", " << bounds.top << ", " << bounds.right
                   << ", " << bounds.bottom << ")" << std::endl;
         if (close(m.bounds.left, bounds.left) && close(m.bounds.top, bounds.top) &&
             close(m.bounds.right, bounds.right) && close(m.bounds.bottom, bounds.bottom))
         {
            return &m;
         }
      }
      return nullptr;
   }

   bool CaptureScreenBase64(const RECT &bounds, std::string &outBase64)
   {
      int width = bounds.right - bounds.left;
      int height = bounds.bottom - bounds.top;

      if (width <= 0 || height <= 0)
         return false;

      HDC hdcScreen = GetDC(nullptr); // DC for the whole virtual desktop
      HDC hdcMem = CreateCompatibleDC(hdcScreen);
      HBITMAP hBitmap = CreateCompatibleBitmap(hdcScreen, width, height);
      HGDIOBJ hOld = SelectObject(hdcMem, hBitmap);

      // CAPTUREBLT pulls in layered/topmost windows (e.g. the cursor
      // overlay some apps draw) that a plain BitBlt can miss.
      BitBlt(hdcMem, 0, 0, width, height, hdcScreen, bounds.left, bounds.top, SRCCOPY | CAPTUREBLT);

      SelectObject(hdcMem, hOld);
      DeleteDC(hdcMem);
      ReleaseDC(nullptr, hdcScreen);

      image_util::GdiplusProcessInit::EnsureStarted();

      Bitmap bmp(hBitmap, nullptr);

      CLSID pngClsid;
      if (image_util::GetEncoderClsid(L"image/png", &pngClsid) != 0)
      {
         DeleteObject(hBitmap);
         return false;
      }

      IStream *stream = nullptr;
      CreateStreamOnHGlobal(nullptr, TRUE, &stream);
      bmp.Save(stream, &pngClsid);

      HGLOBAL hGlobal = nullptr;
      GetHGlobalFromStream(stream, &hGlobal);
      SIZE_T size = GlobalSize(hGlobal);
      void *pData = GlobalLock(hGlobal);

      std::vector<BYTE> pngBytes(size);
      memcpy(pngBytes.data(), pData, size);

      GlobalUnlock(hGlobal);
      stream->Release();
      DeleteObject(hBitmap);

      outBase64 = image_util::Base64Encode(pngBytes);
      return true;
   }

   bool GetScreenThumbnailBase64(int x, int y, int width, int height, std::string &outBase64)
   {
      RECT requested{x, y, x + width, y + height};

      auto monitors = EnumerateMonitors();
      std::cout << "Enumerated " << monitors.size() << " monitors." << std::endl;
      const MonitorInfo *match = FindMonitorByBounds(monitors, requested, 2);
      if (!match)
         return false; // bounds didn't match any current monitor

      return CaptureScreenBase64(match->bounds, outBase64);
   }
}
