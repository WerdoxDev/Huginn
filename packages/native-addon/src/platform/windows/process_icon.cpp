#include "process_icon.h"
#include "icon_util.h"
#include <string>

namespace
{
   namespace
   {
      class ProcessIconWorker : public Napi::AsyncWorker
      {
      public:
         ProcessIconWorker(Napi::Env env, DWORD processId)
             : Napi::AsyncWorker(env),
               processId(processId),
               success(false),
               deferred(Napi::Promise::Deferred::New(env))
         {
         }

         // Runs on a background thread — do NOT touch Napi::Env or any JS values here
         void Execute() override
         {
            success = icon_util::GetProcessIconBase64(processId, base64);
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
         DWORD processId;
         std::string base64;
         bool success;
         Napi::Promise::Deferred deferred;
      };

   }
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

   std::string base64;

   auto *worker = new ProcessIconWorker(env, processId);
   Napi::Promise promise = worker->GetPromise();
   worker->Queue();

   return promise;
}
