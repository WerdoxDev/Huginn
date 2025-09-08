#pragma once
#include <windows.h>
#include <string>
#include <vector>

namespace icon_util
{
   HICON GetExeLargeIcon(const std::wstring &exePath);
   std::string HICONToBase64Png(HICON hIcon);
   std::string PngToBase64Png(const std::wstring pngPath);
}
