#pragma once

#include <windows.h>

namespace window_util
{
   bool GetClientScreenBounds(HWND hwnd, RECT &result);
}
