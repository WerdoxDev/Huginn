#include <napi.h>
#include <string>
#include "../include/cpp_code.h"

// Create a class that will be exposed to JavaScript
class MyAddon : public Napi::ObjectWrap<MyAddon>
{
public:
   // This static method defines the class for JavaScript
   static Napi::Object Init(Napi::Env env, Napi::Object exports)
   {
      // Define the JavaScript class with method(s)
      Napi::Function func = DefineClass(env, "MyAddon", {InstanceMethod("helloWorld", &MyAddon::HelloWorld)});

      // Create a persistent reference to the constructor
      Napi::FunctionReference *constructor = new Napi::FunctionReference();
      *constructor = Napi::Persistent(func);
      env.SetInstanceData(constructor);

      // Set the constructor on the exports object
      exports.Set("MyAddon", func);
      return exports;
   }

   // Constructor
   MyAddon(const Napi::CallbackInfo &info)
       : Napi::ObjectWrap<MyAddon>(info) {}

private:
   // Method that will be exposed to JavaScript
   Napi::Value HelloWorld(const Napi::CallbackInfo &info)
   {
      Napi::Env env = info.Env();

      // Validate arguments (expecting one string)
      if (info.Length() < 1 || !info[0].IsString())
      {
         Napi::TypeError::New(env, "Expected string argument").ThrowAsJavaScriptException();
         return env.Null();
      }

      // Convert JavaScript string to C++ string
      std::string input = info[0].As<Napi::String>();

      // Call our C++ function
      std::string result = cpp_code::hello_world(input);

      // Convert C++ string back to JavaScript string and return
      return Napi::String::New(env, result);
   }
};

// Initialize the addon
Napi::Object Init(Napi::Env env, Napi::Object exports)
{
   return MyAddon::Init(env, exports);
}

// Register the initialization function
NODE_API_MODULE(my_addon, Init)
