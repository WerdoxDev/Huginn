#include "window_util.h"
#include <windows.h>
#include <psapi.h>
#include <string>
#include <vector>
#include <map>
#include <appmodel.h>
#include <iostream>
#include <winternl.h>

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

   std::vector<wchar_t> GetFullName(HANDLE hProcess)
   {
      UINT32 length = 0;
      LONG rc = GetPackageFullName(hProcess, &length, nullptr);

      std::vector<wchar_t> packageName(length);
      rc = GetPackageFullName(hProcess, &length, packageName.data());
      return packageName;
   }

   std::wstring GetPackagePath(HANDLE hProcess)
   {
      std::wstring packagePath = L"";
      // Get process ID
      DWORD processId = GetProcessId(hProcess);
      if (processId == 0)
      {
         return packagePath;
      }

      // Get package full name from process
      UINT32 packageFullNameLength = 0;
      LONG ret = GetPackageFullName(hProcess, &packageFullNameLength, nullptr);

      if (ret != ERROR_INSUFFICIENT_BUFFER)
      {
         return packagePath;
      }

      auto packageFullName = std::make_unique<wchar_t[]>(packageFullNameLength);
      ret = GetPackageFullName(hProcess, &packageFullNameLength, packageFullName.get());

      if (ret != ERROR_SUCCESS)
      {
         return packagePath;
      }

      // Get package info
      PACKAGE_INFO_REFERENCE packageInfoRef;
      ret = OpenPackageInfoByFullName(packageFullName.get(), 0, &packageInfoRef);

      if (ret != ERROR_SUCCESS)
      {
         return packagePath;
      }

      UINT32 bufferLength = 0;
      UINT32 count = 0;

      // Get buffer size
      ret = GetPackageInfo(packageInfoRef, PACKAGE_FILTER_HEAD, &bufferLength, nullptr, &count);

      if (ret == ERROR_INSUFFICIENT_BUFFER && bufferLength > 0)
      {
         auto buffer = std::make_unique<BYTE[]>(bufferLength);
         ret = GetPackageInfo(packageInfoRef, PACKAGE_FILTER_HEAD, &bufferLength, buffer.get(), &count);

         if (ret == ERROR_SUCCESS && count > 0)
         {
            PACKAGE_INFO *packageInfo = reinterpret_cast<PACKAGE_INFO *>(buffer.get());

            if (packageInfo[0].path)
            {
               packagePath = packageInfo[0].path;
            }
         }
      }

      ClosePackageInfo(packageInfoRef);
      return packagePath;
   }

   HANDLE GetHandle(DWORD processId)
   {
      HANDLE hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, processId);
      return hProcess;
   }

   std::wstring GetExecutablePath(HANDLE hProcess)
   {
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

   typedef NTSTATUS(NTAPI *PNtQueryInformationProcess)(
       HANDLE, PROCESSINFOCLASS, PVOID, ULONG, PULONG);

   std::wstring GetProcessCommandLine(DWORD pid)
   {
      HANDLE hProc = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, pid);
      if (!hProc)
         return L"";

      HMODULE hNtDll = GetModuleHandleW(L"ntdll.dll");
      auto NtQueryInformationProcess =
          (PNtQueryInformationProcess)GetProcAddress(hNtDll, "NtQueryInformationProcess");

      PROCESS_BASIC_INFORMATION pbi;
      NtQueryInformationProcess(hProc, ProcessBasicInformation, &pbi, sizeof(pbi), nullptr);

      PEB peb;
      ReadProcessMemory(hProc, pbi.PebBaseAddress, &peb, sizeof(peb), nullptr);

      RTL_USER_PROCESS_PARAMETERS params;
      ReadProcessMemory(hProc, peb.ProcessParameters, &params, sizeof(params), nullptr);

      std::wstring cmdLine(params.CommandLine.Length / sizeof(wchar_t), L'\0');
      ReadProcessMemory(hProc, params.CommandLine.Buffer, &cmdLine[0], params.CommandLine.Length, nullptr);

      CloseHandle(hProc);
      return cmdLine;
   }

   BOOL CALLBACK EnumWindowsProc(HWND hwnd, LPARAM lParam)
   {
      std::vector<ProcessInfo> *apps = reinterpret_cast<std::vector<ProcessInfo> *>(lParam);

      if (!IsWindowVisible(hwnd))
      {
         return TRUE;
      }

      int titleLength = GetWindowTextLengthW(hwnd);
      if (titleLength == 0)
      {
         return TRUE;
      }

      // Skip if not a main window (has owner or parent)
      if (GetWindow(hwnd, GW_OWNER) != NULL)
      {
         return TRUE;
      }

      LONG_PTR exStyle = GetWindowLongPtr(hwnd, GWL_EXSTYLE);
      if (exStyle & WS_EX_TOOLWINDOW)
         return TRUE;

      std::wstring windowTitle(titleLength + 1, 0);
      GetWindowTextW(hwnd, &windowTitle[0], titleLength + 1);
      windowTitle.resize(titleLength);

      if (windowTitle.empty())
      {
         return TRUE;
      }

      DWORD processId;
      GetWindowThreadProcessId(hwnd, &processId);

      HANDLE hProcess = GetHandle(processId);
      std::wstring exePath = GetExecutablePath(hProcess);

      if (exePath.empty())
      {
         return TRUE;
      }

      std::wstring cmdLine = GetProcessCommandLine(processId);

      // std::cout << WideToUtf8(cmdLine) << std::endl;
      // std::this_thread::sleep_for(std::chrono::milliseconds(250));

      ProcessInfo app;
      app.exePath = exePath;
      app.windowTitle = windowTitle;
      app.processId = processId;
      app.cmdLine = cmdLine;
      apps->push_back(app);

      return TRUE;
   }

   std::map<DWORD, ProcessInfo> EnumerateApplications()
   {
      std::vector<ProcessInfo> apps;

      EnumWindows(EnumWindowsProc, reinterpret_cast<LPARAM>(&apps));

      std::map<DWORD, ProcessInfo> uniqueApps;
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
