#pragma once
#include <windows.h>
#include <string>
#include <map>

namespace window_util
{
   struct AppInfo
   {
      std::wstring exePath;
      std::wstring windowTitle;
      DWORD processId;
   };

   std::string WideToUtf8(const std::wstring &wide);
   std::wstring GetExecutablePath(DWORD processId);
   std::map<DWORD, AppInfo> EnumerateApplications();
}
