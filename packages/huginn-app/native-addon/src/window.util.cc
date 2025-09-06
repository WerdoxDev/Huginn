#include "window_util.h"
#include <windows.h>
#include <psapi.h>
#include <string>
#include <vector>
#include <map>

#pragma comment(lib, "psapi.lib")

namespace window_util
{
   std::string WideToUtf8(const std::wstring &wide)
   {
      if (wide.empty())
         return std::string();

      int size = WideCharToMultiByte(CP_UTF8, 0, wide.c_str(), -1, nullptr, 0, nullptr, nullptr);
      std::string result(size - 1, 0);
      WideCharToMultiByte(CP_UTF8, 0, wide.c_str(), -1, &result[0], size, nullptr, nullptr);
      return result;
   }

   std::wstring GetExecutablePath(DWORD processId)
   {
      HANDLE hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, processId);
      if (hProcess == NULL)
      {
         return L"";
      }

      wchar_t exePath[MAX_PATH];
      DWORD size = MAX_PATH;

      if (QueryFullProcessImageNameW(hProcess, 0, exePath, &size))
      {
         CloseHandle(hProcess);
         return std::wstring(exePath);
      }

      // Fallback to GetModuleFileNameEx
      if (GetModuleFileNameExW(hProcess, NULL, exePath, MAX_PATH))
      {
         CloseHandle(hProcess);
         return std::wstring(exePath);
      }

      CloseHandle(hProcess);
      return L"";
   }

   BOOL CALLBACK EnumWindowsProc(HWND hwnd, LPARAM lParam)
   {
      std::vector<AppInfo> *apps = reinterpret_cast<std::vector<AppInfo> *>(lParam);

      // Check if window is visible
      if (!IsWindowVisible(hwnd))
      {
         return TRUE;
      }

      // Get window title
      int titleLength = GetWindowTextLengthW(hwnd);
      if (titleLength == 0)
      {
         return TRUE;
      }

      std::wstring windowTitle(titleLength + 1, 0);
      GetWindowTextW(hwnd, &windowTitle[0], titleLength + 1);
      windowTitle.resize(titleLength);

      // Skip empty titles
      if (windowTitle.empty())
      {
         return TRUE;
      }

      // Get process ID
      DWORD processId;
      GetWindowThreadProcessId(hwnd, &processId);

      // Get executable path
      std::wstring exePath = GetExecutablePath(processId);

      // Skip if we couldn't get the exe path
      if (exePath.empty())
      {
         return TRUE;
      }

      // Add to results
      AppInfo app;
      app.exePath = exePath;
      app.windowTitle = windowTitle;
      app.processId = processId;
      apps->push_back(app);

      return TRUE;
   }

   std::map<DWORD, AppInfo> EnumerateApplications()
   {
      std::vector<AppInfo> apps;

      EnumWindows(EnumWindowsProc, reinterpret_cast<LPARAM>(&apps));

      std::map<DWORD, AppInfo> uniqueApps;
      for (const auto &app : apps)
      {
         auto it = uniqueApps.find(app.processId);
         if (it == uniqueApps.end() || app.windowTitle.length() > it->second.windowTitle.length())
         {
            uniqueApps[app.processId] = app;
         }
      }

      return uniqueApps;
   }
}
