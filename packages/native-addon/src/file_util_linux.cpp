#include <iostream>
#include <fstream>
#include <sstream>
#include <iomanip>
#include <memory>
#include <openssl/evp.h>

namespace file_util
{
   std::string GetFileSHA256(const std::string &filepath)
   {
      std::ifstream file(filepath, std::ios::binary);
      if (!file)
      {
         throw std::runtime_error("Cannot open file: " + filepath);
      }

      EVP_MD_CTX *ctx = EVP_MD_CTX_new();
      if (!ctx)
      {
         throw std::runtime_error("Failed to create EVP_MD_CTX");
      }

      // Use unique_ptr for automatic cleanup
      std::unique_ptr<EVP_MD_CTX, decltype(&EVP_MD_CTX_free)>
          ctx_ptr(ctx, EVP_MD_CTX_free);

      if (EVP_DigestInit_ex(ctx, EVP_sha256(), nullptr) != 1)
      {
         throw std::runtime_error("Failed to initialize SHA256");
      }

      constexpr size_t bufSize = 32768;
      char buf[bufSize];

      while (file.read(buf, bufSize) || file.gcount() > 0)
      {
         if (EVP_DigestUpdate(ctx, buf, file.gcount()) != 1)
         {
            throw std::runtime_error("Failed to update digest");
         }
      }

      unsigned char hash[EVP_MAX_MD_SIZE];
      unsigned int hashLen = 0;

      if (EVP_DigestFinal_ex(ctx, hash, &hashLen) != 1)
      {
         throw std::runtime_error("Failed to finalize digest");
      }

      std::stringstream ss;
      for (unsigned int i = 0; i < hashLen; i++)
      {
         ss << std::hex << std::setw(2) << std::setfill('0')
            << static_cast<int>(hash[i]);
      }

      return ss.str();
   }
}
