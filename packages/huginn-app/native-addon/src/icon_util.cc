#include <windows.h>
#include <shellapi.h>
#include <string>
#include <vector>
#include <gdiplus.h>
#include <iostream>
#include <fstream>

#pragma comment(lib, "gdiplus.lib")

using namespace Gdiplus;

namespace icon_util
{
   HICON GetExeLargeIcon(const std::wstring &exePath)
   {
      HICON hIcon = NULL;
      UINT result = ExtractIconExW(exePath.c_str(), 0, &hIcon, NULL, 1);
      return hIcon;
   }

   std::string HICONToBase64Png(HICON hIcon)
   {
      if (hIcon == NULL)
      {
         return "";
      }

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

   std::string PngToBase64Png(const std::wstring pngPath)
   {
      // Step 1: Read file into memory
      std::ifstream file(pngPath, std::ios::binary | std::ios::ate);
      if (!file)
         throw std::runtime_error("Could not open file");

      std::streamsize size = file.tellg();
      file.seekg(0, std::ios::beg);

      std::vector<BYTE> buffer(size);
      if (!file.read(reinterpret_cast<char *>(buffer.data()), size))
         throw std::runtime_error("Error reading file");

      // Step 2: Base64 encode using Windows API
      DWORD base64Len = 0;
      if (!CryptBinaryToStringA(buffer.data(), static_cast<DWORD>(buffer.size()),
                                CRYPT_STRING_BASE64 | CRYPT_STRING_NOCRLF,
                                nullptr, &base64Len))
      {
         throw std::runtime_error("CryptBinaryToStringW failed");
      }

      std::string base64(base64Len, L'\0');
      if (!CryptBinaryToStringA(buffer.data(), static_cast<DWORD>(buffer.size()),
                                CRYPT_STRING_BASE64 | CRYPT_STRING_NOCRLF,
                                &base64[0], &base64Len))
      {
         throw std::runtime_error("CryptBinaryToStringW failed");
      }

      // CryptBinaryToStringW writes a null terminator, remove it
      if (!base64.empty() && base64.back() == L'\0')
      {
         base64.pop_back();
      }

      // Step 3: Prepend data URL prefix
      return "data:image/png;base64," + base64;
   }
}
