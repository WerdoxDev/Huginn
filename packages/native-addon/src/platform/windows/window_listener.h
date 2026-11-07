#pragma once

#include <napi.h>

Napi::Value ListenToWindowBounds(const Napi::CallbackInfo &info);
Napi::Value ListenToWindowClose(const Napi::CallbackInfo &info);
Napi::Value ListenToWindowFocus(const Napi::CallbackInfo &info);
