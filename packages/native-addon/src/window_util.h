#pragma once
#include <windows.h>
#include <string>
#include <map>
#include <vector>
#include <winrt/Windows.ApplicationModel.h>
#include <winrt/Windows.Management.Deployment.h>

using namespace winrt::Windows::ApplicationModel;
using namespace winrt::Windows::Management::Deployment;

namespace window_util
{
   struct ProcessInfo
   {
      std::wstring exePath;
      std::wstring windowTitle;
      std::wstring cmdLine;
      DWORD processId;
      HWND hwnd;
   };

   std::string WideToUtf8(const std::wstring &wide);
   std::wstring GetExecutablePath(HANDLE hProcess);
   winrt::hstring GetPackageDisplayName(DWORD processId);
   HBITMAP CaptureWindowToBitmap(HWND hwnd, int &outW, int &outH);
   bool GetWindowThumbnailBase64(HWND hwnd, int thumbW, int thumbH, std::string &outBase64);
   bool IsCloaked(HWND hwnd);
   HANDLE GetHandle(DWORD processId);
   std::map<DWORD, ProcessInfo> EnumerateApplications();
}
