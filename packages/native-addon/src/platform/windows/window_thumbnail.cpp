#include "window_thumbnail.h"
#include "window_util.h"
#include <string>

namespace
{
   class WindowThumbnailWorker : public Napi::AsyncWorker
   {
   public:
      WindowThumbnailWorker(Napi::Env env, HWND hwnd, int width, int height)
          : Napi::AsyncWorker(env),
            hwnd(hwnd), width(width), height(height),
            success(false),
            deferred(Napi::Promise::Deferred::New(env))
      {
      }

      // Runs on a background thread — do NOT touch Napi::Env or any JS values here
      void Execute() override
      {
         success = window_util::GetWindowThumbnailBase64(hwnd, width, height, base64);
      }

      // Runs back on the main thread once Execute() returns
      void OnOK() override
      {
         Napi::Env env = Env();
         Napi::HandleScope scope(env);

         if (success)
         {
            std::string dataUrl = "data:image/png;base64," + base64;
            deferred.Resolve(Napi::String::New(env, dataUrl));
         }
         else
         {
            deferred.Resolve(env.Null());
         }
      }

      void OnError(const Napi::Error &e) override
      {
         deferred.Reject(e.Value());
      }

      Napi::Promise GetPromise() { return deferred.Promise(); }

   private:
      HWND hwnd;
      int width, height;
      std::string base64;
      bool success;
      Napi::Promise::Deferred deferred;
   };
}

Napi::Value GetWindowThumbnailBase64(const Napi::CallbackInfo &info)
{
   Napi::Env env = info.Env();

   if (info.Length() != 3)
   {
      Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
      return env.Null();
   }

   if (!info[0].IsNumber() || !info[1].IsNumber() || !info[2].IsNumber())
   {
      Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
      return env.Null();
   }

   uintptr_t hwndValue = info[0].As<Napi::Number>().Int64Value();
   HWND hwnd = reinterpret_cast<HWND>(hwndValue);

   std::string base64;

   int thumbW = info[1].As<Napi::Number>().Uint32Value();
   int thumbH = info[2].As<Napi::Number>().Uint32Value();

   auto *worker = new WindowThumbnailWorker(env, hwnd, thumbW, thumbH);
   Napi::Promise promise = worker->GetPromise();
   worker->Queue();

   return promise;
}
