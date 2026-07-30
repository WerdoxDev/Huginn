#pragma once

#include <windows.h>
#include <string>
#include <vector>

namespace screen_util
{
   struct MonitorInfo
   {
      HMONITOR hMonitor;
      RECT bounds; // in virtual-screen (desktop) coordinates
      bool isPrimary;
   };

   BOOL CALLBACK MonitorEnumProc(HMONITOR hMonitor, HDC, LPRECT lprcMonitor, LPARAM lParam);
   std::vector<MonitorInfo> EnumerateMonitors();
   const MonitorInfo *FindMonitorByBounds(const std::vector<MonitorInfo> &monitors, const RECT &bounds, int tolerancePx);
   bool CaptureScreenBase64(const RECT &bounds, std::string &outBase64);
   bool GetScreenThumbnailBase64(int x, int y, int width, int height, std::string &outBase64);
}
