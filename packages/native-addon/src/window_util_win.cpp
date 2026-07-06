#include "window_util.h"
#include <windows.h>
#include <psapi.h>
#include <string>
#include <vector>
#include <map>
#include <winrt/Windows.ApplicationModel.h>
#include <winrt/Windows.Management.Deployment.h>
#include <appmodel.h>
#include <iostream>
#include <winternl.h>
#include <dwmapi.h>

using namespace winrt::Windows::ApplicationModel;
using namespace winrt::Windows::Management::Deployment;

#pragma comment(lib, "dwmapi.lib")
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

   winrt::hstring GetPackageDisplayName(DWORD processId)
   {
      HANDLE hProcess = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, processId);
      if (!hProcess)
      {
         throw std::runtime_error("OpenProcess failed");
      }

      UINT32 length = 0;
      LONG rc = GetPackageFullName(hProcess, &length, nullptr);
      if (rc != ERROR_INSUFFICIENT_BUFFER)
      {
         CloseHandle(hProcess);
         if (rc == APPMODEL_ERROR_NO_PACKAGE)
         {
            return L""; // not a packaged process (plain Win32 exe)
         }
         throw std::runtime_error("GetPackageFullName failed");
      }

      std::wstring fullName(length, L'\0');
      rc = GetPackageFullName(hProcess, &length, fullName.data());
      CloseHandle(hProcess);
      if (rc != ERROR_SUCCESS)
      {
         throw std::runtime_error("GetPackageFullName failed (2nd call)");
      }
      fullName.resize(wcslen(fullName.c_str())); // trim to actual length

      PackageManager packageManager;
      auto package = packageManager.FindPackageForUser(L"", fullName);
      if (!package)
      {
         return L"";
      }
      return package.DisplayName();
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

   bool IsCloaked(HWND hwnd)
   {
      int cloaked = 0;
      HRESULT hr = DwmGetWindowAttribute(hwnd, DWMWA_CLOAKED, &cloaked, sizeof(cloaked));
      return SUCCEEDED(hr) && cloaked != 0;
   }

   BOOL CALLBACK EnumWindowsProc(HWND hwnd, LPARAM lParam)
   {
      std::vector<ProcessInfo> *apps = reinterpret_cast<std::vector<ProcessInfo> *>(lParam);

      if (!IsWindowVisible(hwnd))
      {
         return TRUE;
      }

      if (IsCloaked(hwnd))
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
