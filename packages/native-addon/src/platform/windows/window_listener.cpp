#include "window_listener.h"
#include "window_bounds.h"

#include <atomic>
#include <cmath>
#include <future>
#include <memory>
#include <optional>
#include <thread>
#include <windows.h>

namespace
{
   enum class ListenerKind { Bounds, Close, Focus };

   struct WindowListener
   {
      static void CallJs(Napi::Env env, Napi::Function callback, WindowListener *listener, void *)
      {
         if (!env || !callback || listener->cancelled)
            return;

         if (listener->kind == ListenerKind::Close)
         {
            if (listener->windowClosed && !listener->cancelled.exchange(true))
               callback.Call({});
            return;
         }
         if (!listener->active)
            return;

         if (listener->kind == ListenerKind::Focus)
         {
            bool focused = GetForegroundWindow() == listener->hwnd;
            if (!listener->lastFocus || focused != *listener->lastFocus)
            {
               listener->lastFocus = focused;
               callback.Call({Napi::Boolean::New(env, focused)});
            }
            return;
         }

         RECT rect{};
         if (!window_util::GetClientScreenBounds(listener->hwnd, rect))
         {
            listener->Stop();
            return;
         }
         if (EqualRect(&rect, &listener->lastRect))
            return;
         listener->lastRect = rect;

         Napi::Object bounds = Napi::Object::New(env);
         bounds.Set("x", Napi::Number::New(env, rect.left));
         bounds.Set("y", Napi::Number::New(env, rect.top));
         bounds.Set("width", Napi::Number::New(env, rect.right - rect.left));
         bounds.Set("height", Napi::Number::New(env, rect.bottom - rect.top));
         callback.Call({bounds});
      }

      using Callback = Napi::TypedThreadSafeFunction<WindowListener, void, CallJs>;

      HWND hwnd;
      const ListenerKind kind;
      HANDLE stopEvent = CreateEventW(nullptr, TRUE, FALSE, nullptr);
      std::atomic<bool> active{true};
      std::atomic<bool> cancelled{false};
      std::atomic<bool> windowClosed{false};
      std::thread thread;
      Callback callback;
      RECT lastRect{};
      std::optional<bool> lastFocus; // Accessed only on the JavaScript thread.
      bool cleanupRegistered = false; // Accessed only on the JavaScript thread.
      bool callbackClosing = false; // Accessed only on the hook thread.
      static thread_local WindowListener *current;

      WindowListener(HWND window, ListenerKind listenerKind) : hwnd(window), kind(listenerKind) {}

      ~WindowListener()
      {
         Stop();
         if (stopEvent)
            CloseHandle(stopEvent);
      }

      void Stop()
      {
         cancelled = true;
         active = false;
         if (stopEvent)
            SetEvent(stopEvent);
         if (thread.joinable())
            thread.join();
      }

      static void Cleanup(void *data)
      {
         auto *listener = static_cast<WindowListener *>(data);
         listener->cleanupRegistered = false;
         listener->Stop();
      }

      void Notify()
      {
         // A single pending notification reads the latest bounds or focus state.
         if (callback.NonBlockingCall() == napi_closing)
         {
            callbackClosing = true;
            active = false;
            SetEvent(stopEvent);
         }
      }

      static void CALLBACK OnEvent(HWINEVENTHOOK, DWORD event, HWND window,
                                   LONG objectId, LONG childId, DWORD, DWORD)
      {
         auto *listener = current;
         if (!listener || !listener->active)
            return;
         // Observe all foreground changes so switching to another process reports blur.
         if (event == EVENT_SYSTEM_FOREGROUND)
         {
            listener->Notify();
            return;
         }
         if (window != listener->hwnd || objectId != OBJID_WINDOW || childId != CHILDID_SELF)
            return;

         if (event == EVENT_OBJECT_DESTROY)
         {
            listener->windowClosed = true;
            listener->active = false;
            SetEvent(listener->stopEvent);
         }
         else if (event == EVENT_OBJECT_LOCATIONCHANGE)
         {
            listener->Notify();
         }
      }

      void Run(std::promise<bool> ready)
      {
         current = this;
         DWORD processId = 0;
         DWORD threadId = GetWindowThreadProcessId(hwnd, &processId);
         HWINEVENTHOOK changeHook = nullptr;
         HWINEVENTHOOK destroyHook = nullptr;
         if (threadId)
         {
            if (kind == ListenerKind::Bounds)
               changeHook = SetWinEventHook(EVENT_OBJECT_LOCATIONCHANGE, EVENT_OBJECT_LOCATIONCHANGE,
                                         nullptr, OnEvent, processId, threadId, WINEVENT_OUTOFCONTEXT);
            else if (kind == ListenerKind::Focus)
               changeHook = SetWinEventHook(EVENT_SYSTEM_FOREGROUND, EVENT_SYSTEM_FOREGROUND,
                                           nullptr, OnEvent, 0, 0, WINEVENT_OUTOFCONTEXT);
            destroyHook = SetWinEventHook(EVENT_OBJECT_DESTROY, EVENT_OBJECT_DESTROY,
                                         nullptr, OnEvent, processId, threadId, WINEVENT_OUTOFCONTEXT);
         }

         // Recheck after installing the hooks to cover closure during registration.
         bool started = destroyHook && (kind == ListenerKind::Close || changeHook) && IsWindow(hwnd) &&
                        (kind != ListenerKind::Bounds || window_util::GetClientScreenBounds(hwnd, lastRect));
         ready.set_value(started);
         // An initial notification lets callers set visibility without a separate query.
         if (started && kind == ListenerKind::Focus)
            Notify();
         while (started && active)
         {
            DWORD result = MsgWaitForMultipleObjectsEx(1, &stopEvent, 1000,
                                                       QS_ALLINPUT, MWMO_INPUTAVAILABLE);
            // Some applications omit DESTROY events, including during abrupt exit.
            if (result == WAIT_TIMEOUT)
            {
               DWORD currentProcessId = 0;
               if (!IsWindow(hwnd) || GetWindowThreadProcessId(hwnd, &currentProcessId) != threadId ||
                   currentProcessId != processId)
               {
                  windowClosed = true;
                  break;
               }
               continue;
            }
            if (result != WAIT_OBJECT_0 + 1)
               break;

            MSG message;
            while (active && PeekMessageW(&message, nullptr, 0, 0, PM_REMOVE))
            {
               if (message.message == WM_QUIT)
               {
                  active = false;
                  break;
               }
               TranslateMessage(&message);
               DispatchMessageW(&message);
            }
         }

         active = false;
         // Windows requires unhooking on the thread that installed the hooks.
         if (changeHook)
            UnhookWinEvent(changeHook);
         if (destroyHook)
            UnhookWinEvent(destroyHook);
         current = nullptr;
         if (!callbackClosing)
         {
            if (kind == ListenerKind::Close && windowClosed && !cancelled)
            {
               // Release drains the final close notification; Abort would discard it.
               if (callback.NonBlockingCall() != napi_closing)
                  callback.Release();
            }
            else
               callback.Abort();
         }
      }
   };

   thread_local WindowListener *WindowListener::current = nullptr;

   Napi::Value ListenToWindow(const Napi::CallbackInfo &info, ListenerKind kind)
   {
      Napi::Env env = info.Env();
      if (info.Length() != 2 || !info[0].IsNumber() || !info[1].IsFunction())
      {
         Napi::TypeError::New(env, "Expected a window handle and a callback").ThrowAsJavaScriptException();
         return env.Undefined();
      }

      double handle = info[0].As<Napi::Number>().DoubleValue();
      if (!std::isfinite(handle) || handle <= 0 || std::floor(handle) != handle ||
          handle > 9007199254740991.0 ||
          (sizeof(uintptr_t) == 4 && handle > 4294967295.0))
      {
         Napi::TypeError::New(env, "Expected a positive, safe integer window handle").ThrowAsJavaScriptException();
         return env.Undefined();
      }

      HWND hwnd = reinterpret_cast<HWND>(static_cast<uintptr_t>(handle));
      if (!IsWindow(hwnd))
      {
         Napi::Error::New(env, "Window handle is no longer valid").ThrowAsJavaScriptException();
         return env.Undefined();
      }

      auto listener = std::make_shared<WindowListener>(hwnd, kind);
      if (!listener->stopEvent)
      {
         Napi::Error::New(env, "Failed to create window listener stop event").ThrowAsJavaScriptException();
         return env.Undefined();
      }

      // The TSFN owns the listener until its worker has stopped and queued calls have drained.
      auto owner = std::make_unique<std::shared_ptr<WindowListener>>(listener);
      const char *resourceName = kind == ListenerKind::Close ? "Window close listener" :
                                 kind == ListenerKind::Focus ? "Window focus listener" : "Window bounds listener";
      listener->callback = WindowListener::Callback::New(
          env, info[1].As<Napi::Function>(), resourceName, 1, 1, listener.get(),
          [](Napi::Env env, std::shared_ptr<WindowListener> *owner, WindowListener *listener)
          {
             listener->Stop();
             if (listener->cleanupRegistered)
                napi_remove_env_cleanup_hook(env, WindowListener::Cleanup, listener);
             delete owner;
          }, owner.get());
      owner.release();

      if (napi_add_env_cleanup_hook(env, WindowListener::Cleanup, listener.get()) != napi_ok)
      {
         listener->callback.Abort();
         Napi::Error::New(env, "Failed to register window listener cleanup").ThrowAsJavaScriptException();
         return env.Undefined();
      }
      listener->cleanupRegistered = true;
      listener->callback.Unref(env);

      std::promise<bool> ready;
      auto started = ready.get_future();
      try
      {
         listener->thread = std::thread([state = listener.get(), ready = std::move(ready)]() mutable
                                       { state->Run(std::move(ready)); });
      }
      catch (const std::exception &error)
      {
         listener->callback.Abort();
         Napi::Error::New(env, error.what()).ThrowAsJavaScriptException();
         return env.Undefined();
      }

      if (!started.get())
      {
         listener->Stop();
         Napi::Error::New(env, "Failed to install window event hooks; the window may have closed").ThrowAsJavaScriptException();
         return env.Undefined();
      }

      // Keeping unlisten after closure must not retain the native listener or JS callback.
      return Napi::Function::New(env, [weak = std::weak_ptr<WindowListener>(listener)](const Napi::CallbackInfo &info)
                                {
                                   if (auto listener = weak.lock())
                                      listener->Stop();
                                   return info.Env().Undefined();
                                }, "unlisten");
   }
}

Napi::Value ListenToWindowBounds(const Napi::CallbackInfo &info)
{
   return ListenToWindow(info, ListenerKind::Bounds);
}

Napi::Value ListenToWindowClose(const Napi::CallbackInfo &info)
{
   return ListenToWindow(info, ListenerKind::Close);
}

Napi::Value ListenToWindowFocus(const Napi::CallbackInfo &info)
{
   return ListenToWindow(info, ListenerKind::Focus);
}
