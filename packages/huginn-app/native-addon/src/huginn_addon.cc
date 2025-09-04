#include <napi.h>
#include <string>
#include "icon_util.h"
#include "file_util.h"
#include <iostream>

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

   const std::u16string filepath_u16 = info[0].As<Napi::String>().Utf16Value();
   std::wstring filepath(filepath_u16.begin(), filepath_u16.end());

   std::string hash = file_util::GetFileSHA256(filepath);

   return Napi::String::New(env, hash);
}

Napi::Value GetExeLargeIcon(const Napi::CallbackInfo &info)
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

   HICON hIcon = icon_util::GetExeLargeIcon(exePath);
   std::string base64 = icon_util::HICONToBase64Png(hIcon);

   return Napi::String::New(env, base64);
}

Napi::Object Init(Napi::Env env, Napi::Object exports)
{
   exports.Set(Napi::String::New(env, "getFileSha256"), Napi::Function::New(env, GetFileSHA256));
   exports.Set(Napi::String::New(env, "getExeLargeIcon"), Napi::Function::New(env, GetExeLargeIcon));
   return exports;
}

NODE_API_MODULE(huginn_addon, Init)
