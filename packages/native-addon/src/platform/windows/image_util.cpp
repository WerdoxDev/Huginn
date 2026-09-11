#include "image_util.h"

#include <windows.h>
#include <string>
#include <vector>
#include <gdiplus.h>
#include <wincrypt.h>

#pragma comment(lib, "gdiplus.lib")
#pragma comment(lib, "crypt32.lib")
using namespace Gdiplus;

namespace image_util
{
   std::string Base64Encode(const std::vector<BYTE> &data)
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

   int GetEncoderClsid(const WCHAR *mimeType, CLSID *pClsid)
   {
      UINT numEncoders = 0, size = 0;
      GetImageEncodersSize(&numEncoders, &size);
      if (size == 0)
         return -1;

      std::vector<BYTE> buffer(size);
      auto *codecInfo = reinterpret_cast<ImageCodecInfo *>(buffer.data());
      GetImageEncoders(numEncoders, size, codecInfo);

      for (UINT i = 0; i < numEncoders; ++i)
      {
         if (wcscmp(codecInfo[i].MimeType, mimeType) == 0)
         {
            *pClsid = codecInfo[i].Clsid;
            return 0;
         }
      }
      return -1;
   }
}
