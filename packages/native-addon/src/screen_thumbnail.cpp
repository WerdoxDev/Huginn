#include "screen_thumbnail.h"
#include "screen_util.h"
#include <string>

namespace
{
   class ScreenThumbnailWorker : public Napi::AsyncWorker
   {
   public:
      ScreenThumbnailWorker(Napi::Env env, int x, int y, int width, int height)
          : Napi::AsyncWorker(env),
            x(x), y(y), width(width), height(height),
            success(false),
            deferred(Napi::Promise::Deferred::New(env))
      {
      }

      // Runs on a background thread — do NOT touch Napi::Env or any JS values here
      void Execute() override
      {
         success = screen_util::GetScreenThumbnailBase64(x, y, width, height, base64);
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
      int x, y, width, height;
      std::string base64;
      bool success;
      Napi::Promise::Deferred deferred;
   };

}

Napi::Value GetScreenThumbnailBase64(const Napi::CallbackInfo &info)
{
   Napi::Env env = info.Env();

   if (info.Length() != 4)
   {
      Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
      return env.Null();
   }

   if (!info[0].IsNumber() || !info[1].IsNumber() || !info[2].IsNumber() || !info[3].IsNumber())
   {
      Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
      return env.Null();
   }

   int x = info[0].As<Napi::Number>().Uint32Value();
   int y = info[1].As<Napi::Number>().Uint32Value();
   int width = info[2].As<Napi::Number>().Uint32Value();
   int height = info[3].As<Napi::Number>().Uint32Value();

   auto *worker = new ScreenThumbnailWorker(env, x, y, width, height);
   Napi::Promise promise = worker->GetPromise();
   worker->Queue();

   return promise;
}
