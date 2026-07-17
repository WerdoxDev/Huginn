#include <napi.h>
#include <string>
#include <iostream>
#include <map>
#include "file_util.h"
#include <winrt/Windows.ApplicationModel.h>
#include <winrt/Windows.Management.Deployment.h>

#if _WIN32
#include "screen_thumbnail.h"
#include "window_thumbnail.h"
#include "process_icon.h"
#include "window_util.h"
#include "icon_util.h"
#include "screen_util.h"
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
      object.Set("hwnd", Napi::Number::New(env, reinterpret_cast<uintptr_t>(app.hwnd)));

      result[index++] = object;
   }

   return result;
}

Napi::Value GetPackageDisplayName(const Napi::CallbackInfo &info)
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

   winrt::hstring displayName;
   if (window_util::GetPackageDisplayName(processId, displayName))
   {
      std::string narrow = winrt::to_string(displayName);
      return Napi::String::New(env, narrow);
   }

   return env.Null();
}

#endif

Napi::Object Init(Napi::Env env, Napi::Object exports)
{
   exports.Set(Napi::String::New(env, "getFileSha256"), Napi::Function::New(env, GetFileSHA256));
#if _WIN32
   exports.Set(Napi::String::New(env, "getProcessIconBase64"), Napi::Function::New(env, GetProcessIconBase64));
   exports.Set(Napi::String::New(env, "getOpenApplications"), Napi::Function::New(env, GetOpenApplications));
   exports.Set(Napi::String::New(env, "getPackageDisplayName"), Napi::Function::New(env, GetPackageDisplayName));
   exports.Set(Napi::String::New(env, "getWindowThumbnailBase64"), Napi::Function::New(env, GetWindowThumbnailBase64));
   exports.Set(Napi::String::New(env, "getScreenThumbnailBase64"), Napi::Function::New(env, GetScreenThumbnailBase64));
#endif
   return exports;
}

NODE_API_MODULE(huginn_addon, Init)
