#pragma once
#include <string>
#include <filesystem>

namespace fs = std::filesystem;

namespace file_util
{
   std::string GetFileSHA256(const std::string &filepath);
}
