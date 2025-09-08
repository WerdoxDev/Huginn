#pragma once
#include <windows.h>
#include <string>
#include <map>
#include <vector>

namespace window_util
{
   struct AppInfo
   {
      std::wstring exePath;
      std::wstring windowTitle;
      DWORD processId;
   };

   std::string WideToUtf8(const std::wstring &wide);
   std::wstring GetExecutablePath(HANDLE hProcess);
   std::wstring GetPackagePath(HANDLE hProcess);
   HANDLE GetHandle(DWORD processId);
   std::vector<wchar_t> GetFullName(HANDLE hProcess);
   std::map<DWORD, AppInfo> EnumerateApplications();
}
