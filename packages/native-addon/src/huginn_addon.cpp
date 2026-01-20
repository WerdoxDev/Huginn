#include <napi.h>
#include <string>
#include <iostream>
#include <map>
#include "file_util.h"

#if _WIN32
#include "window_util.h"
#include "icon_util.h"
#endif

Napi::Value GetFileSHA256(const Napi::CallbackInfo &info)
{
   Napi::Env env = info.Env();

   if (info.Length() != 1)
   {
      Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
      return env.Null();
   }

   if (!info[0].IsString())
   {
      Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
      return env.Null();
   }

   const std::string filepath = info[0].As<Napi::String>().Utf8Value();
   // const std::u16string filepath_u16 = info[0].As<Napi::String>().Utf16Value();
   // std::wstring filepath(filepath_u16.begin(), filepath_u16.end());

   std::string hash = file_util::GetFileSHA256(filepath);

   return Napi::String::New(env, hash);
}

#if _WIN32
Napi::Value GetExeIconBase64(const Napi::CallbackInfo &info)
{
   Napi::Env env = info.Env();

   if (info.Length() != 1)
   {
      Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
      return env.Null();
   }

   if (!info[0].IsString())
   {
      Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
      return env.Null();
   }

   const std::u16string exePath_u16 = info[0].As<Napi::String>().Utf16Value();
   std::wstring exePath(exePath_u16.begin(), exePath_u16.end());

   std::string base64 = icon_util::GetExeIconBase64(exePath);

   return Napi::String::New(env, base64);
}

Napi::Value GetProcessIconBase64(const Napi::CallbackInfo &info)
{
   Napi::Env env = info.Env();

   if (info.Length() != 1)
   {
      Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
      return env.Null();
   }

   if (!info[0].IsNumber())
   {
      Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
      return env.Null();
   }

   DWORD processId = info[0].As<Napi::Number>().Uint32Value();

   std::string base64 = icon_util::GetProcessIconBase64(processId);

   return Napi::String::New(env, base64);
}

Napi::Value GetOpenApplications(const Napi::CallbackInfo &info)
{
   Napi::Env env = info.Env();

   std::map<DWORD, window_util::ProcessInfo> uniqueApps = window_util::EnumerateApplications();
   Napi::Array result = Napi::Array::New(env, uniqueApps.size());

   uint32_t index = 0;
   for (const auto &pair : uniqueApps)
   {
      const window_util::ProcessInfo &app = pair.second;

      Napi::Object object = Napi::Object::New(env);
      object.Set("exePath", Napi::String::New(env, window_util::WideToUtf8(app.exePath)));
      object.Set("windowTitle", Napi::String::New(env, window_util::WideToUtf8(app.windowTitle)));
      object.Set("cmdLine", Napi::String::New(env, window_util::WideToUtf8(app.cmdLine)));
      object.Set("processId", Napi::Number::New(env, app.processId));

      result[index++] = object;
   }

   return result;
}

Napi::Value GetPackagePath(const Napi::CallbackInfo &info)
{
   Napi::Env env = info.Env();

   if (info.Length() != 1)
   {
      Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
      return env.Null();
   }

   if (!info[0].IsNumber())
   {
      Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
      return env.Null();
   }

   DWORD processId = info[0].As<Napi::Number>().Uint32Value();

   HANDLE hProcess = window_util::GetHandle(processId);
   std::wstring packagePath = window_util::GetPackagePath(hProcess);

   return Napi::String::New(env, window_util::WideToUtf8(packagePath));
}

Napi::Value GetPngFileBase64(const Napi::CallbackInfo &info)
{
   Napi::Env env = info.Env();

   if (info.Length() != 1)
   {
      Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
      return env.Null();
   }

   if (!info[0].IsString())
   {
      Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
      return env.Null();
   }

   const std::u16string pngPath_u16 = info[0].As<Napi::String>().Utf16Value();
   std::wstring pngPath(pngPath_u16.begin(), pngPath_u16.end());

   std::string base64 = icon_util::GetPngFileBase64(pngPath);

   return Napi::String::New(env, base64);
}
#endif

Napi::Object Init(Napi::Env env, Napi::Object exports)
{
   exports.Set(Napi::String::New(env, "getFileSha256"), Napi::Function::New(env, GetFileSHA256));
#if _WIN32
   exports.Set(Napi::String::New(env, "getExeIconBase64"), Napi::Function::New(env, GetExeIconBase64));
   exports.Set(Napi::String::New(env, "getProcessIconBase64"), Napi::Function::New(env, GetProcessIconBase64));
   exports.Set(Napi::String::New(env, "getOpenApplications"), Napi::Function::New(env, GetOpenApplications));
   exports.Set(Napi::String::New(env, "getPackagePath"), Napi::Function::New(env, GetPackagePath));
   exports.Set(Napi::String::New(env, "getPngFileBase64"), Napi::Function::New(env, GetPngFileBase64));
#endif
   return exports;
}

NODE_API_MODULE(huginn_addon, Init)
