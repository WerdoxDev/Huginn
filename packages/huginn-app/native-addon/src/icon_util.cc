#include <windows.h>
#include <shellapi.h>
#include <string>
#include <vector>
#include <gdiplus.h>
#include <iostream>
#pragma comment(lib, "gdiplus.lib")

using namespace Gdiplus;

namespace icon_util
{
   HICON GetExeLargeIcon(const std::wstring &exePath)
   {
      HICON hIcon = NULL;
      ExtractIconExW(exePath.c_str(), 0, &hIcon, NULL, 1);

      return hIcon;
   }

   std::string HICONToBase64Png(HICON hIcon)
   {
      GdiplusStartupInput gdiplusStartupInput;
      ULONG_PTR gdiplusToken;
      GdiplusStartup(&gdiplusToken, &gdiplusStartupInput, nullptr);

      Gdiplus::Bitmap *bmp = Gdiplus::Bitmap::FromHICON(hIcon);
      IStream *istream = nullptr;
      CreateStreamOnHGlobal(NULL, TRUE, &istream);

      CLSID pngClsid;
      CLSIDFromString(L"{557CF406-1A04-11D3-9A73-0000F81EF32E}", &pngClsid);

      bmp->Save(istream, &pngClsid, nullptr);

      HGLOBAL hg = NULL;
      GetHGlobalFromStream(istream, &hg);
      void *buffer = GlobalLock(hg);
      SIZE_T size = GlobalSize(hg);

      DWORD b64Len = 0;
      CryptBinaryToStringA((BYTE *)buffer, size, CRYPT_STRING_BASE64 | CRYPT_STRING_NOCRLF, NULL, &b64Len);
      std::vector<char> b64(b64Len);
      CryptBinaryToStringA((BYTE *)buffer, size, CRYPT_STRING_BASE64 | CRYPT_STRING_NOCRLF, b64.data(), &b64Len);

      GlobalUnlock(hg);

      istream->Release();
      delete bmp;
      GdiplusShutdown(gdiplusToken);

      return "data:image/png;base64," + std::string(b64.data());
   }
}
