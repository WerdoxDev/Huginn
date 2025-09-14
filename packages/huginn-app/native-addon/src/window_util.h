#pragma once
#include <windows.h>
#include <string>
#include <map>
#include <vector>

namespace window_util
{
   struct ProcessInfo
   {
      std::wstring exePath;
      std::wstring windowTitle;
      std::wstring cmdLine;
      DWORD processId;
   };

   std::string WideToUtf8(const std::wstring &wide);
   std::wstring GetExecutablePath(HANDLE hProcess);
   std::wstring GetPackagePath(HANDLE hProcess);
   HANDLE GetHandle(DWORD processId);
   std::vector<wchar_t> GetFullName(HANDLE hProcess);
   std::map<DWORD, ProcessInfo> EnumerateApplications();
}
