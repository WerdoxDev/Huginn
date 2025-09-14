#pragma once
#include <windows.h>
#include <string>
#include <vector>

namespace icon_util
{
   HICON GetExeHICON(const std::wstring &exePath);
   HICON GetProcessHICON(DWORD processId);
   std::string GetPngFileBase64(const std::wstring pngPath);
   std::string GetExeIconBase64(const std::wstring &exePath);
   std::string GetProcessIconBase64(DWORD processId);

   std::string base64_encode(const std::vector<BYTE> &data);
   std::vector<BYTE> HICONToPngData(HICON hIcon);
}
