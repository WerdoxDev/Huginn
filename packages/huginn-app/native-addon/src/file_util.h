#pragma once
#include <string>
#include <filesystem>

namespace fs = std::filesystem;

namespace file_util
{
   std::string GetFileSHA256(const std::wstring &filepath);
   std::vector<fs::path> FindFiles(const fs::path &baseDir, std::vector<std::string> &searchFileNames);
}
