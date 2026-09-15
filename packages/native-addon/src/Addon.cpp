#include <napi.h>
#include "NativeAddon.h"

Napi::Object InitAll(Napi::Env env, Napi::Object exports)
{
   return NativeAddon::Init(env, exports);
}

NODE_API_MODULE(huginn_addon, InitAll)
