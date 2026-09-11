#pragma once
#include <windows.h>
#include <string>
#include <vector>
#include <gdiplus.h>

#pragma comment(lib, "gdiplus.lib")
using namespace Gdiplus;

namespace image_util
{
   class GdiplusProcessInit
   {
   public:
      static void EnsureStarted()
      {
         static GdiplusProcessInit instance; // constructed exactly once,
                                             // thread-safe since C++11
      }

   private:
      ULONG_PTR token_;
      GdiplusProcessInit()
      {
         GdiplusStartupInput input;
         GdiplusStartup(&token_, &input, nullptr);
      }
      ~GdiplusProcessInit()
      {
         GdiplusShutdown(token_);
      }
   };

   int GetEncoderClsid(const WCHAR *mimeType, CLSID *pClsid);
   std::string Base64Encode(const std::vector<BYTE> &data);
}
