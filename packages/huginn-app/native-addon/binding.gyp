{
  "targets": [
    {
      "target_name": "huginn_addon",
      "sources": [
        "src/huginn_addon.cc",
        "src/icon_util.cc",
        "src/file_util.cc"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "include"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "defines": [
        "NODE_ADDON_API_CPP_EXCEPTIONS"
      ],
      "libraries":[
         "-lCrypt32",   # for Base64 encode
      ],
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "xcode_settings": {
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
        "CLANG_CXX_LIBRARY": "libc++",
        "MACOSX_DEPLOYMENT_TARGET": "10.14"
      },
      "msvs_settings": {
        "VCCLCompilerTool": {
          "ExceptionHandling": 1,
        }
      }
    }
  ]
}
