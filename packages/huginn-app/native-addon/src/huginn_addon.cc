#include <node_api.h>
#include <string>
#include "../include/icon_util.h"
#include "../include/file_util.h"
#include <iostream>

class HuginnAddon : public Napi::ObjectWrap<HuginnAddon>
{
public:
   static Napi::Object Init(Napi::Env env, Napi::Object exports)
   {

      Napi::Function func = DefineClass(env, "HuginnAddon", {InstanceMethod("helloWorld", &HuginnAddon::HelloWorld)});

      Napi::FunctionReference *constructor = new Napi::FunctionReference();
      *constructor = Napi::Persistent(func);
      env.SetInstanceData(constructor);

      exports.Set("HuginnAddon", func);
      return exports;
   }

   HuginnAddon(const Napi::CallbackInfo &info)
       : Napi::ObjectWrap<HuginnAddon>(info) {}

private:
   Napi::Value HelloWorld(const Napi::CallbackInfo &info)
   {
      Napi::Env env = info.Env();

      const std::wstring exePath = L"C:\\Users\\matin\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe";

      std::string hash = file_util::GetFileSHA256(exePath);

      return Napi::String::New(env, hash);
   }
};

Napi::Object Init(Napi::Env env, Napi::Object exports)
{
   return HuginnAddon::Init(env, exports);
}

NODE_API_MODULE(huginn_addon, Init)
