cmake_minimum_required(VERSION 3.15...3.31)
project(huginn_addon LANGUAGES C CXX)

# Let clangd use the same include paths, definitions,
# and C++ standard as the build.
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

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
        ${PLATFORM_DIR}/window_listener.cpp
        ${PLATFORM_DIR}/window_thumbnail.cpp
        ${PLATFORM_DIR}/window_util.cpp
    )
elseif(CMAKE_SYSTEM_NAME STREQUAL "Linux")
    find_package(OpenSSL REQUIRED COMPONENTS Crypto)
    find_package(PkgConfig REQUIRED)
    pkg_check_modules(WAYLAND REQUIRED IMPORTED_TARGET wayland-client>=1.20)
    find_program(WAYLAND_SCANNER wayland-scanner REQUIRED)

    set(PLATFORM_DIR src/platform/linux)
    set(PLATFORM_SOURCES
        ${PLATFORM_DIR}/NativeAddon.cpp
        ${PLATFORM_DIR}/file_util.cpp
    )

    set(OVERLAY_PROTOCOL_SOURCES)
    foreach(PROTOCOL wlr-layer-shell-unstable-v1 viewporter xdg-shell)
        set(XML "${CMAKE_CURRENT_SOURCE_DIR}/${PLATFORM_DIR}/protocols/${PROTOCOL}.xml")
        set(HEADER "${CMAKE_CURRENT_BINARY_DIR}/${PROTOCOL}-client-protocol.h")
        set(CODE "${CMAKE_CURRENT_BINARY_DIR}/${PROTOCOL}-protocol.c")
        add_custom_command(OUTPUT "${HEADER}" "${CODE}"
            COMMAND "${WAYLAND_SCANNER}" client-header "${XML}" "${HEADER}"
            COMMAND "${WAYLAND_SCANNER}" private-code "${XML}" "${CODE}"
            DEPENDS "${XML}" VERBATIM)
        list(APPEND OVERLAY_PROTOCOL_SOURCES "${HEADER}" "${CODE}")
    endforeach()

    add_executable(huginn-hyprland-overlay
        ${PLATFORM_DIR}/hyprland_overlay.cpp ${OVERLAY_PROTOCOL_SOURCES})
    target_include_directories(huginn-hyprland-overlay PRIVATE "${CMAKE_CURRENT_BINARY_DIR}")
    target_link_libraries(huginn-hyprland-overlay PRIVATE PkgConfig::WAYLAND)
    target_compile_features(huginn-hyprland-overlay PRIVATE cxx_std_20)
    target_compile_options(huginn-hyprland-overlay PRIVATE -Wall -Wextra -Wpedantic)
    set_target_properties(huginn-hyprland-overlay PROPERTIES
        RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_BINARY_DIR}/Release")
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
        COMMAND ${CMAKE_AR} /def:${CMAKE_JS_NODELIB_DEF}
        /out:${CMAKE_JS_NODELIB_TARGET} ${CMAKE_STATIC_LINKER_FLAGS}
    )
endif()
