#include "NativeAddon.h"

#include "file_util.h"

#include <exception>
#include <string>

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

      try
      {
         const std::string filepath = info[0].As<Napi::String>().Utf8Value();
         return Napi::String::New(env, file_util::GetFileSHA256(filepath));
      }
      catch (const std::exception &error)
      {
         Napi::Error::New(env, error.what()).ThrowAsJavaScriptException();
         return env.Undefined();
      }
   }

   Napi::Value ThrowNotImplemented(const Napi::CallbackInfo &info, const char *functionName)
   {
      Napi::Error::New(info.Env(), std::string(functionName) + " is not implemented on Linux")
          .ThrowAsJavaScriptException();
      return info.Env().Undefined();
   }

   Napi::Value GetProcessIconBase64(const Napi::CallbackInfo &info)
   {
      return ThrowNotImplemented(info, "getProcessIconBase64");
   }

   Napi::Value GetOpenApplications(const Napi::CallbackInfo &info)
   {
      return ThrowNotImplemented(info, "getOpenApplications");
   }

   Napi::Value GetPackageDisplayName(const Napi::CallbackInfo &info)
   {
      return Napi::String::New(info.Env(), "");
      // return ThrowNotImplemented(info, "getPackageDisplayName");
   }

   Napi::Value GetWindowThumbnailBase64(const Napi::CallbackInfo &info)
   {
      return ThrowNotImplemented(info, "getWindowThumbnailBase64");
   }

   Napi::Value GetScreenThumbnailBase64(const Napi::CallbackInfo &info)
   {
      return ThrowNotImplemented(info, "getScreenThumbnailBase64");
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
