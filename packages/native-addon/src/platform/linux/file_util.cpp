#include "file_util.h"

#include <array>
#include <fstream>
#include <iomanip>
#include <memory>
#include <sstream>
#include <stdexcept>

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

      std::unique_ptr<EVP_MD_CTX, decltype(&EVP_MD_CTX_free)> context(EVP_MD_CTX_new(), EVP_MD_CTX_free);
      if (!context)
      {
         throw std::runtime_error("Failed to create EVP_MD_CTX");
      }

      if (EVP_DigestInit_ex(context.get(), EVP_sha256(), nullptr) != 1)
      {
         throw std::runtime_error("Failed to initialize SHA-256");
      }

      std::array<char, 32768> buffer{};

      while (file.read(buffer.data(), buffer.size()) || file.gcount() > 0)
      {
         if (EVP_DigestUpdate(context.get(), buffer.data(), static_cast<std::size_t>(file.gcount())) != 1)
         {
            throw std::runtime_error("Failed to update digest");
         }
      }

      if (file.bad())
      {
         throw std::runtime_error("Failed to read file: " + filepath);
      }

      std::array<unsigned char, EVP_MAX_MD_SIZE> hash{};
      unsigned int hashLen = 0;

      if (EVP_DigestFinal_ex(context.get(), hash.data(), &hashLen) != 1)
      {
         throw std::runtime_error("Failed to finalize digest");
      }

      std::stringstream ss;
      ss << std::hex << std::setfill('0');
      for (unsigned int i = 0; i < hashLen; i++)
      {
         ss << std::setw(2) << static_cast<unsigned int>(hash[i]);
      }

      return ss.str();
   }
}
