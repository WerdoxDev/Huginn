#include "NativeAddon.h"

#include "file_util.h"
#include "process_icon.h"
#include "screen_thumbnail.h"
#include "window_thumbnail.h"
#include "window_util.h"

#include <map>
#include <string>
#include <windows.h>

namespace
{
   Napi::Value GetFileSHA256(const Napi::CallbackInfo &info)
   {
      Napi::Env env = info.Env();

      if (info.Length() != 1)
      {
         Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
         return env.Undefined();
      }

      if (!info[0].IsString())
      {
         Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
         return env.Undefined();
      }

      const std::string filepath = info[0].As<Napi::String>().Utf8Value();
      return Napi::String::New(env, file_util::GetFileSHA256(filepath));
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
         return env.Undefined();
      }

      if (!info[0].IsNumber())
      {
         Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
         return env.Undefined();
      }

      const DWORD processId = info[0].As<Napi::Number>().Uint32Value();
      winrt::hstring displayName;
      if (window_util::GetPackageDisplayName(processId, displayName))
      {
         return Napi::String::New(env, winrt::to_string(displayName));
      }

      return env.Null();
   }
}

Napi::Object NativeAddon::Init(Napi::Env env, Napi::Object exports)
{
   exports.Set("getFileSha256", Napi::Function::New(env, GetFileSHA256));
   exports.Set("getProcessIconBase64", Napi::Function::New(env, GetProcessIconBase64));
   exports.Set("getOpenApplications", Napi::Function::New(env, GetOpenApplications));
   exports.Set("getPackageDisplayName", Napi::Function::New(env, GetPackageDisplayName));
   exports.Set("getWindowThumbnailBase64", Napi::Function::New(env, GetWindowThumbnailBase64));
   exports.Set("getScreenThumbnailBase64", Napi::Function::New(env, GetScreenThumbnailBase64));
   return exports;
}
