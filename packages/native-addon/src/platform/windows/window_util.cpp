#include "window_util.h"
#include "image_util.h"
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
#include <cstdio>
#include <gdiplus.h>

using namespace winrt::Windows::ApplicationModel;
using namespace winrt::Windows::Management::Deployment;

#pragma comment(lib, "dwmapi.lib")
#pragma comment(lib, "psapi.lib")
#pragma comment(lib, "ole32.lib")
#pragma comment(lib, "gdiplus.lib")

using namespace Gdiplus;

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

   bool GetPackageDisplayName(DWORD processId, winrt::hstring &outDisplayName)
   {
      HANDLE hProcess = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, processId);
      if (!hProcess)
         return false;

      UINT32 length = 0;
      LONG rc = GetPackageFullName(hProcess, &length, nullptr);
      if (rc != ERROR_INSUFFICIENT_BUFFER)
      {
         CloseHandle(hProcess);
         return false;
      }

      std::wstring fullName(length, L'\0');
      rc = GetPackageFullName(hProcess, &length, fullName.data());
      CloseHandle(hProcess);
      if (rc != ERROR_SUCCESS)
         return false;
      fullName.resize(wcslen(fullName.c_str())); // trim to actual length

      PackageManager packageManager;
      auto package = packageManager.FindPackageForUser(L"", fullName);
      if (!package)
      {
         return false;
      }
      outDisplayName = package.DisplayName();
      return true;
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

   bool CaptureWindowToBitmap(HWND hwnd, int &outW, int &outH, HBITMAP &outBitmap)
   {
      // DWMWA_EXTENDED_FRAME_BOUNDS gives the true visible window rect,
      // without the invisible resize-border padding Win10/11 add around
      // top-level windows. Falls back to GetWindowRect if DWM call fails.
      RECT rect{};
      if (FAILED(DwmGetWindowAttribute(hwnd, DWMWA_EXTENDED_FRAME_BOUNDS, &rect, sizeof(rect))))
      {
         GetWindowRect(hwnd, &rect);
      }

      int width = rect.right - rect.left;
      int height = rect.bottom - rect.top;

      if (width <= 0 || height <= 0)
         return false; // window is minimized, no bitmap available

      HDC hdcWindow = GetWindowDC(hwnd);
      HDC hdcMem = CreateCompatibleDC(hdcWindow);
      HBITMAP hBitmap = CreateCompatibleBitmap(hdcWindow, width, height);
      HGDIOBJ hOld = SelectObject(hdcMem, hBitmap);

      // PW_RENDERFULLWINDOW (=2) asks the target app to render its full
      // content, including anything drawn via DirectX/DirectComposition
      // (browsers, many modern apps). Fall back to flag 0 if that fails.
      BOOL ok = PrintWindow(hwnd, hdcMem, PW_RENDERFULLCONTENT);
      if (!ok)
         PrintWindow(hwnd, hdcMem, 0);

      SelectObject(hdcMem, hOld);
      DeleteDC(hdcMem);
      ReleaseDC(hwnd, hdcWindow);

      outW = width;
      outH = height;

      outBitmap = hBitmap; // caller owns
      return true;
   }

   bool GetWindowThumbnailBase64(HWND hwnd, int thumbW, int thumbH, std::string &outBase64)
   {
      if (IsIconic(hwnd))
         return false; // window is minimized, no thumbnail available

      image_util::GdiplusProcessInit::EnsureStarted();

      int srcW = 0, srcH = 0;
      HBITMAP hSrcBitmap = nullptr;
      if (!CaptureWindowToBitmap(hwnd, srcW, srcH, hSrcBitmap))
         return false;

      // Wrap the raw HBITMAP in a GDI+ Bitmap so it can be resized + encoded.
      Bitmap srcBitmap(hSrcBitmap, nullptr);

      // Fit inside thumbW x thumbH while preserving aspect ratio.
      double scale = min((double)thumbW / srcW, (double)thumbH / srcH);
      int dstW = max(1, (int)(srcW * scale));
      int dstH = max(1, (int)(srcH * scale));

      Bitmap thumbBitmap(dstW, dstH, PixelFormat32bppARGB);
      Graphics g(&thumbBitmap);
      g.SetInterpolationMode(InterpolationModeHighQualityBicubic);
      g.SetSmoothingMode(SmoothingModeHighQuality);
      g.DrawImage(&srcBitmap, 0, 0, dstW, dstH);

      DeleteObject(hSrcBitmap);

      // Encode as PNG into an in-memory IStream.
      CLSID pngClsid;
      if (image_util::GetEncoderClsid(L"image/png", &pngClsid) != 0)
         return false;

      IStream *stream = nullptr;
      CreateStreamOnHGlobal(nullptr, TRUE, &stream);
      thumbBitmap.Save(stream, &pngClsid);

      // Pull the bytes back out of the stream's backing HGLOBAL.
      HGLOBAL hGlobal = nullptr;
      GetHGlobalFromStream(stream, &hGlobal);
      SIZE_T size = GlobalSize(hGlobal);
      void *pData = GlobalLock(hGlobal);

      std::vector<BYTE> pngBytes(size);
      memcpy(pngBytes.data(), pData, size);

      GlobalUnlock(hGlobal);
      stream->Release();

      outBase64 = image_util::Base64Encode(pngBytes);
      return true;
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
      app.hwnd = hwnd;
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
