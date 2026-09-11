cmake_minimum_required(VERSION 3.15...3.31)
project(huginn_addon LANGUAGES CXX)

add_compile_definitions(NAPI_VERSION=9)

set(COMMON_SOURCES
    src/Addon.cpp
)

if(WIN32)
    set(PLATFORM_DIR src/platform/windows)
    set(PLATFORM_SOURCES
        ${PLATFORM_DIR}/NativeAddon.cpp
        ${PLATFORM_DIR}/file_util.cpp
        ${PLATFORM_DIR}/icon_util.cpp
        ${PLATFORM_DIR}/image_util.cpp
        ${PLATFORM_DIR}/process_icon.cpp
        ${PLATFORM_DIR}/screen_thumbnail.cpp
        ${PLATFORM_DIR}/screen_util.cpp
        ${PLATFORM_DIR}/window_thumbnail.cpp
        ${PLATFORM_DIR}/window_util.cpp
    )
elseif(CMAKE_SYSTEM_NAME STREQUAL "Linux")
    find_package(OpenSSL REQUIRED COMPONENTS Crypto)

    set(PLATFORM_DIR src/platform/linux)
    set(PLATFORM_SOURCES
        ${PLATFORM_DIR}/NativeAddon.cpp
        ${PLATFORM_DIR}/file_util.cpp
    )
else()
    message(FATAL_ERROR "native-addon supports Windows and Linux only")
endif()

add_library(${PROJECT_NAME} SHARED
    ${COMMON_SOURCES}
    ${PLATFORM_SOURCES}
    ${CMAKE_JS_SRC}
)
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")

target_include_directories(${PROJECT_NAME} PRIVATE
    ${CMAKE_JS_INC}
    ${PLATFORM_DIR}
)

target_link_libraries(${PROJECT_NAME} PRIVATE ${CMAKE_JS_LIB})

if(WIN32)
    target_link_libraries(${PROJECT_NAME} PRIVATE
        windowsapp.lib
        crypt32.lib
        dwmapi.lib
        gdiplus.lib
        ole32.lib
        psapi.lib
        shell32.lib
    )
elseif(CMAKE_SYSTEM_NAME STREQUAL "Linux")
    target_link_libraries(${PROJECT_NAME} PRIVATE OpenSSL::Crypto)
endif()

target_compile_features(${PROJECT_NAME} PRIVATE cxx_std_20)

if(MSVC AND CMAKE_JS_NODELIB_DEF AND CMAKE_JS_NODELIB_TARGET)
    # Generate node.lib.
    execute_process(
        COMMAND ${CMAKE_AR} /def:${CMAKE_JS_NODELIB_DEF} /out:${CMAKE_JS_NODELIB_TARGET} ${CMAKE_STATIC_LINKER_FLAGS}
    )
endif()
