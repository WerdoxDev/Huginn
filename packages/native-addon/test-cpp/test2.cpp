// WindowThumbnailBase64.cpp
//
// Capture a thumbnail of an open window (given its HWND) and return it
// as a base64-encoded PNG string.
//
// Build (MSVC, from a "Developer Command Prompt"):
//   cl /EHsc WindowThumbnailBase64.cpp gdiplus.lib crypt32.lib dwmapi.lib user32.lib gdi32.lib
//
// Or, in a Visual Studio project, just add this file and link against:
//   gdiplus.lib, crypt32.lib, dwmapi.lib  (user32/gdi32 are linked by default)

#include <windows.h>
#include <gdiplus.h>
#include <dwmapi.h>
#include <wincrypt.h>
#include <string>
#include <vector>
#include <stdexcept>
#include <cstdio>

#pragma comment(lib, "gdiplus.lib")
#pragma comment(lib, "crypt32.lib")
#pragma comment(lib, "dwmapi.lib")
#pragma comment(lib, "ole32.lib")

using namespace Gdiplus;

// ---------------------------------------------------------------------
// Helper: find the GDI+ encoder CLSID for a given MIME type (e.g. PNG)
// ---------------------------------------------------------------------
static bool GetEncoderClsid(const WCHAR *format, CLSID *pClsid)
{
   UINT num = 0, size = 0;
   GetImageEncodersSize(&num, &size);
   if (size == 0)
      return false;

   std::vector<BYTE> buffer(size);
   ImageCodecInfo *codecInfo = reinterpret_cast<ImageCodecInfo *>(buffer.data());
   GetImageEncoders(num, size, codecInfo);

   for (UINT i = 0; i < num; ++i)
   {
      if (wcscmp(codecInfo[i].MimeType, format) == 0)
      {
         *pClsid = codecInfo[i].Clsid;
         return true;
      }
   }
   return false;
}

// ---------------------------------------------------------------------
// Helper: base64-encode a byte buffer using CryptBinaryToStringA
// ---------------------------------------------------------------------
static std::string Base64Encode(const std::vector<BYTE> &data)
{
   if (data.empty())
      return "";

   DWORD outLen = 0;
   CryptBinaryToStringA(data.data(), (DWORD)data.size(),
                        CRYPT_STRING_BASE64 | CRYPT_STRING_NOCRLF, nullptr, &outLen);

   std::string out(outLen, '\0');
   CryptBinaryToStringA(data.data(), (DWORD)data.size(),
                        CRYPT_STRING_BASE64 | CRYPT_STRING_NOCRLF, &out[0], &outLen);

   // Trim any trailing NUL(s) some CRT/CryptoAPI combos leave behind.
   while (!out.empty() && out.back() == '\0')
      out.pop_back();
   return out;
}

// ---------------------------------------------------------------------
// Capture hwnd's contents into an HBITMAP. Caller owns the result and
// must DeleteObject() it (this is done for you inside the pipeline below).
// ---------------------------------------------------------------------
static HBITMAP CaptureWindowToBitmap(HWND hwnd, int &outW, int &outH)
{
   // DWMWA_EXTENDED_FRAME_BOUNDS gives the true visible window rect,
   // without the invisible resize-border padding Win10/11 add around
   // top-level windows. Falls back to GetWindowRect if DWM call fails.
   RECT rect{};
   if (FAILED(DwmGetWindowAttribute(hwnd, DWMWA_EXTENDED_FRAME_BOUNDS,
                                    &rect, sizeof(rect))))
   {
      GetWindowRect(hwnd, &rect);
   }

   int width = rect.right - rect.left;
   int height = rect.bottom - rect.top;
   if (width <= 0 || height <= 0)
      throw std::runtime_error("Invalid window size (is the window minimized?)");

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
   return hBitmap; // caller owns
}

// ---------------------------------------------------------------------
// Full pipeline: HWND -> resized thumbnail -> PNG bytes -> base64 string
// ---------------------------------------------------------------------
std::string CaptureWindowThumbnailBase64(HWND hwnd, int thumbW = 256, int thumbH = 256)
{
   int srcW = 0, srcH = 0;
   HBITMAP hSrcBitmap = CaptureWindowToBitmap(hwnd, srcW, srcH);

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
   if (!GetEncoderClsid(L"image/png", &pngClsid))
      throw std::runtime_error("PNG encoder not found");

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

   return Base64Encode(pngBytes);
}

// ---------------------------------------------------------------------
// Example usage
// ---------------------------------------------------------------------
int main()
{
   // GDI+ must be started before any GDI+ calls and shut down at exit.
   GdiplusStartupInput gdiplusStartupInput;
   ULONG_PTR gdiplusToken;
   GdiplusStartup(&gdiplusToken, &gdiplusStartupInput, nullptr);

   // Replace with your actual HWND (this is just a demo lookup).
   HWND hwnd = FindWindowW(nullptr, L"Claude");
   if (!hwnd)
   {
      printf("Window not found\n");
      GdiplusShutdown(gdiplusToken);
      return 1;
   }

   try
   {
      std::string base64Png = CaptureWindowThumbnailBase64(hwnd, 256, 256);
      printf(base64Png.c_str());
      // e.g. drop straight into an <img> tag:
      // "<img src='data:image/png;base64," + base64Png + "'>"
   }
   catch (const std::exception &e)
   {
      printf("Error: %s\n", e.what());
   }

   GdiplusShutdown(gdiplusToken);
   return 0;
}
