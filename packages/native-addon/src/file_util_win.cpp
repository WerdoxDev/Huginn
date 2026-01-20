#include <string>
#include <fstream>
#include <iostream>
#include <sstream>
#include <iomanip>
#include <vector>
#include <windows.h>
#include <filesystem>

#pragma comment(lib, "crypt32.lib")

namespace fs = std::filesystem;

namespace file_util
{
   std::string GetFileSHA256(const std::string &filepath)
   {
      std::ifstream file(filepath, std::ios::binary);
      if (!file.is_open())
      {
         return "";
      }

      HCRYPTPROV hProv = 0;
      if (!CryptAcquireContext(&hProv, NULL, NULL, PROV_RSA_AES, CRYPT_VERIFYCONTEXT))
      {
         return "";
      }

      HCRYPTHASH hHash = 0;
      if (!CryptCreateHash(hProv, CALG_SHA_256, 0, 0, &hHash))
      {
         CryptReleaseContext(hProv, 0);
         return "";
      }

      const size_t BUFFER_SIZE = 4096;
      std::vector<char> buffer(BUFFER_SIZE);

      while (file.read(buffer.data(), BUFFER_SIZE) || file.gcount() > 0)
      {
         DWORD bytesRead = static_cast<DWORD>(file.gcount());
         if (!CryptHashData(hHash, reinterpret_cast<BYTE *>(buffer.data()), bytesRead, 0))
         {
            CryptDestroyHash(hHash);
            CryptReleaseContext(hProv, 0);
            return "";
         }
      }

      DWORD hashSize = 0;
      DWORD hashSizeSize = sizeof(DWORD);
      if (!CryptGetHashParam(hHash, HP_HASHSIZE, reinterpret_cast<BYTE *>(&hashSize), &hashSizeSize, 0))
      {
         CryptDestroyHash(hHash);
         CryptReleaseContext(hProv, 0);
         return "";
      }

      std::vector<BYTE> hashBytes(hashSize);
      if (!CryptGetHashParam(hHash, HP_HASHVAL, hashBytes.data(), &hashSize, 0))
      {
         CryptDestroyHash(hHash);
         CryptReleaseContext(hProv, 0);
         return "";
      }

      std::stringstream ss;
      ss << std::hex << std::setfill('0');
      for (DWORD i = 0; i < hashSize; i++)
      {
         ss << std::setw(2) << static_cast<unsigned>(hashBytes[i]);
      }

      CryptDestroyHash(hHash);
      CryptReleaseContext(hProv, 0);
      file.close();

      return ss.str();
   }
}
