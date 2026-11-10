// Displays Electron offscreen BGRA frames on a click-through Wayland overlay layer.
// Wire format (little endian): type, width, height, x, y, payload length (six u32s).
// 1 = configure (logical geometry, UTF-8 output name); 2 = frame (pixel size, BGRA);
// 3 = hide. EOF exits. Stdout emits "ready\n" after binding the required protocols.
#include <wayland-client.h>
#include "wlr-layer-shell-unstable-v1-client-protocol.h"
#include "viewporter-client-protocol.h"

#include <algorithm>
#include <array>
#include <cerrno>
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <fcntl.h>
#include <memory>
#include <poll.h>
#include <stdexcept>
#include <string>
#include <sys/mman.h>
#include <unistd.h>
#include <vector>

namespace {
constexpr size_t MAX_FRAME_BYTES = 64 * 1024 * 1024;
constexpr uint32_t MAX_DIMENSION = 8192;
constexpr size_t HEADER_BYTES = 24;

uint32_t readU32(const uint8_t *data) {
    return uint32_t(data[0]) | (uint32_t(data[1]) << 8) |
           (uint32_t(data[2]) << 16) | (uint32_t(data[3]) << 24);
}

struct Output {
    uint32_t id;
    wl_output *object;
    std::string name;
    ~Output() { wl_output_release(object); }
};

struct Buffer {
    wl_buffer *object = nullptr;
    void *data = MAP_FAILED;
    size_t bytes = 0;
    uint32_t width = 0, height = 0;
    bool busy = false;
    ~Buffer() {
        if (object) wl_buffer_destroy(object);
        if (data != MAP_FAILED) munmap(data, bytes);
    }
};

class Overlay {
    wl_display *display = nullptr;
    wl_registry *registry = nullptr;
    wl_compositor *compositor = nullptr;
    wl_shm *shm = nullptr;
    zwlr_layer_shell_v1 *shell = nullptr;
    wp_viewporter *viewporter = nullptr;
    wl_surface *surface = nullptr;
    zwlr_layer_surface_v1 *layer = nullptr;
    wp_viewport *viewport = nullptr;
    Output *currentOutput = nullptr;
    std::vector<std::unique_ptr<Output>> outputs;
    std::vector<std::unique_ptr<Buffer>> buffers;
    std::vector<uint8_t> incoming, frame;
    uint32_t width = 0, height = 0, frameWidth = 0, frameHeight = 0;
    uint64_t frameSerial = 0, submittedSerial = 0;
    bool configured = false;

    static void global(void *data, wl_registry *reg, uint32_t id, const char *name, uint32_t version) {
        auto &self = *static_cast<Overlay *>(data);
        if (strcmp(name, wl_compositor_interface.name) == 0 && version >= 4)
            self.compositor = static_cast<wl_compositor *>(wl_registry_bind(reg, id, &wl_compositor_interface, 4));
        else if (strcmp(name, wl_shm_interface.name) == 0)
            self.shm = static_cast<wl_shm *>(wl_registry_bind(reg, id, &wl_shm_interface, 1));
        else if (strcmp(name, zwlr_layer_shell_v1_interface.name) == 0)
            self.shell = static_cast<zwlr_layer_shell_v1 *>(wl_registry_bind(reg, id, &zwlr_layer_shell_v1_interface, std::min(version, 4u)));
        else if (strcmp(name, wp_viewporter_interface.name) == 0)
            self.viewporter = static_cast<wp_viewporter *>(wl_registry_bind(reg, id, &wp_viewporter_interface, 1));
        else if (strcmp(name, wl_output_interface.name) == 0 && version >= 4) {
            auto output = std::make_unique<Output>();
            output->id = id;
            output->object = static_cast<wl_output *>(wl_registry_bind(reg, id, &wl_output_interface, 4));
            static const wl_output_listener listener = {
                .geometry = [](void *, wl_output *, int32_t, int32_t, int32_t, int32_t, int32_t, const char *, const char *, int32_t) {},
                .mode = [](void *, wl_output *, uint32_t, int32_t, int32_t, int32_t) {},
                .done = [](void *, wl_output *) {},
                .scale = [](void *, wl_output *, int32_t) {},
                .name = [](void *p, wl_output *, const char *value) { static_cast<Output *>(p)->name = value; },
                .description = [](void *, wl_output *, const char *) {},
            };
            wl_output_add_listener(output->object, &listener, output.get());
            self.outputs.push_back(std::move(output));
        }
    }

    static void globalRemove(void *data, wl_registry *, uint32_t id) {
        auto &self = *static_cast<Overlay *>(data);
        std::erase_if(self.outputs, [&](const auto &output) {
            if (output->id != id) return false;
            if (output.get() == self.currentOutput) self.hide();
            return true;
        });
    }

    void hide() {
        configured = false;
        currentOutput = nullptr;
        if (viewport) wp_viewport_destroy(viewport);
        if (layer) zwlr_layer_surface_v1_destroy(layer);
        if (surface) wl_surface_destroy(surface);
        viewport = nullptr;
        layer = nullptr;
        surface = nullptr;
        submittedSerial = 0;
    }

    void configure(uint32_t w, uint32_t h, int32_t x, int32_t y, const std::string &outputName) {
        auto found = std::find_if(outputs.begin(), outputs.end(), [&](const auto &o) { return o->name == outputName; });
        if (found == outputs.end()) { hide(); return; }
        if (currentOutput != found->get()) hide();
        width = w;
        height = h;
        if (!surface) {
            currentOutput = found->get();
            surface = wl_compositor_create_surface(compositor);
            layer = zwlr_layer_shell_v1_get_layer_surface(shell, surface, currentOutput->object,
                ZWLR_LAYER_SHELL_V1_LAYER_OVERLAY, "huginn-overlay");
            viewport = wp_viewporter_get_viewport(viewporter, surface);
            static const zwlr_layer_surface_v1_listener listener = {
                .configure = [](void *p, zwlr_layer_surface_v1 *s, uint32_t serial, uint32_t, uint32_t) {
                    auto &self = *static_cast<Overlay *>(p);
                    zwlr_layer_surface_v1_ack_configure(s, serial);
                    self.configured = true;
                    self.submittedSerial = 0;
                },
                .closed = [](void *p, zwlr_layer_surface_v1 *) { static_cast<Overlay *>(p)->hide(); },
            };
            zwlr_layer_surface_v1_add_listener(layer, &listener, this);
            zwlr_layer_surface_v1_set_anchor(layer, ZWLR_LAYER_SURFACE_V1_ANCHOR_TOP | ZWLR_LAYER_SURFACE_V1_ANCHOR_LEFT);
            zwlr_layer_surface_v1_set_exclusive_zone(layer, -1);
            zwlr_layer_surface_v1_set_keyboard_interactivity(layer, ZWLR_LAYER_SURFACE_V1_KEYBOARD_INTERACTIVITY_NONE);
            auto *empty = wl_compositor_create_region(compositor);
            wl_surface_set_input_region(surface, empty);
            wl_region_destroy(empty);
        }
        zwlr_layer_surface_v1_set_size(layer, width, height);
        zwlr_layer_surface_v1_set_margin(layer, y, 0, 0, x);
        wp_viewport_set_destination(viewport, width, height);
        wl_surface_commit(surface);
    }

    Buffer *getBuffer() {
        // Keep at most three buffers, and never overwrite one owned by the compositor.
        std::erase_if(buffers, [&](const auto &b) { return !b->busy && (b->width != frameWidth || b->height != frameHeight); });
        for (auto &buffer : buffers) if (!buffer->busy) return buffer.get();
        if (buffers.size() >= 3) return nullptr;

        auto buffer = std::make_unique<Buffer>();
        buffer->bytes = frame.size();
        buffer->width = frameWidth;
        buffer->height = frameHeight;
        int fd = memfd_create("huginn-overlay", MFD_CLOEXEC);
        if (fd < 0) throw std::runtime_error("memfd_create failed");
        if (ftruncate(fd, buffer->bytes) < 0) { close(fd); throw std::runtime_error("ftruncate failed"); }
        buffer->data = mmap(nullptr, buffer->bytes, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
        if (buffer->data == MAP_FAILED) { close(fd); throw std::runtime_error("mmap failed"); }
        auto *pool = wl_shm_create_pool(shm, fd, buffer->bytes);
        buffer->object = wl_shm_pool_create_buffer(pool, 0, frameWidth, frameHeight, frameWidth * 4, WL_SHM_FORMAT_ARGB8888);
        wl_shm_pool_destroy(pool);
        close(fd);
        static const wl_buffer_listener listener = {
            .release = [](void *p, wl_buffer *) { static_cast<Buffer *>(p)->busy = false; },
        };
        wl_buffer_add_listener(buffer->object, &listener, buffer.get());
        auto *result = buffer.get();
        buffers.push_back(std::move(buffer));
        return result;
    }

    void present() {
        if (!configured || !surface || frame.empty() || submittedSerial == frameSerial) return;
        auto *buffer = getBuffer();
        if (!buffer) return;
        memcpy(buffer->data, frame.data(), frame.size());
        buffer->busy = true;
        wl_surface_attach(surface, buffer->object, 0, 0);
        wl_surface_damage_buffer(surface, 0, 0, frameWidth, frameHeight);
        wl_surface_commit(surface);
        submittedSerial = frameSerial;
    }

    void parse() {
        size_t offset = 0;
        while (incoming.size() - offset >= HEADER_BYTES) {
            const auto *header = incoming.data() + offset;
            const uint32_t type = readU32(header), w = readU32(header + 4), h = readU32(header + 8);
            const uint32_t length = readU32(header + 20);
            if (length > MAX_FRAME_BYTES) throw std::runtime_error("overlay message too large");
            if (type == 1) {
                if (!w || !h || w > MAX_DIMENSION || h > MAX_DIMENSION || length > 256)
                    throw std::runtime_error("invalid overlay geometry");
            } else if (type == 2) {
                if (!w || !h || w > MAX_DIMENSION || h > MAX_DIMENSION || uint64_t(w) * h * 4 != length)
                    throw std::runtime_error("invalid overlay frame");
            } else if (type != 3 || length != 0) throw std::runtime_error("unknown overlay message");
            if (incoming.size() - offset - HEADER_BYTES < length) break;
            const auto *payload = header + HEADER_BYTES;
            if (type == 1)
                configure(w, h, static_cast<int32_t>(readU32(header + 12)), static_cast<int32_t>(readU32(header + 16)),
                    std::string(reinterpret_cast<const char *>(payload), length));
            else if (type == 2) {
                frameWidth = w;
                frameHeight = h;
                frame.assign(payload, payload + length);
                ++frameSerial;
            } else hide();
            offset += HEADER_BYTES + length;
        }
        incoming.erase(incoming.begin(), incoming.begin() + offset);
    }

public:
    ~Overlay() {
        hide();
        buffers.clear();
        outputs.clear();
        if (viewporter) wp_viewporter_destroy(viewporter);
        if (shell) zwlr_layer_shell_v1_destroy(shell);
        if (shm) wl_shm_destroy(shm);
        if (compositor) wl_compositor_destroy(compositor);
        if (registry) wl_registry_destroy(registry);
        if (display) wl_display_disconnect(display);
    }

    void run() {
        display = wl_display_connect(nullptr);
        if (!display) throw std::runtime_error("cannot connect to Wayland");
        registry = wl_display_get_registry(display);
        static const wl_registry_listener listener = {global, globalRemove};
        wl_registry_add_listener(registry, &listener, this);
        if (wl_display_roundtrip(display) < 0 || wl_display_roundtrip(display) < 0)
            throw std::runtime_error("Wayland registry roundtrip failed");
        if (!compositor || !shm || !shell || !viewporter || outputs.empty())
            throw std::runtime_error("compositor lacks layer-shell, viewporter, or named outputs");
        if (fcntl(STDIN_FILENO, F_SETFL, O_NONBLOCK) < 0) throw std::runtime_error("cannot configure stdin");
        puts("ready");
        fflush(stdout);

        for (;;) {
            if (wl_display_dispatch_pending(display) < 0) throw std::runtime_error("Wayland dispatch failed");
            present();
            while (wl_display_prepare_read(display) != 0) {
                if (wl_display_dispatch_pending(display) < 0) throw std::runtime_error("Wayland dispatch failed");
            }
            const int flushed = wl_display_flush(display);
            if (flushed < 0 && errno != EAGAIN) {
                wl_display_cancel_read(display);
                throw std::runtime_error("Wayland flush failed");
            }
            pollfd fds[] = {{STDIN_FILENO, POLLIN, 0},
                {wl_display_get_fd(display), short(POLLIN | (flushed < 0 ? POLLOUT : 0)), 0}};
            int result = poll(fds, 2, -1);
            if (result < 0) {
                wl_display_cancel_read(display);
                if (errno == EINTR) continue;
                throw std::runtime_error("poll failed");
            }
            if (fds[1].revents & POLLIN) {
                if (wl_display_read_events(display) < 0) throw std::runtime_error("Wayland connection lost");
            } else wl_display_cancel_read(display);
            if (fds[1].revents & (POLLERR | POLLHUP | POLLNVAL)) throw std::runtime_error("Wayland connection lost");
            if (fds[0].revents & (POLLIN | POLLHUP)) {
                std::array<uint8_t, 65536> chunk;
                // Bound each iteration so a busy producer cannot starve Wayland events.
                for (int i = 0; i < 32; ++i) {
                    ssize_t count = read(STDIN_FILENO, chunk.data(), chunk.size());
                    if (count == 0) {
                        if (!incoming.empty()) throw std::runtime_error("truncated overlay message");
                        return;
                    }
                    if (count < 0) {
                        if (errno == EINTR) continue;
                        if (errno == EAGAIN) break;
                        throw std::runtime_error("stdin read failed");
                    }
                    incoming.insert(incoming.end(), chunk.begin(), chunk.begin() + count);
                    parse();
                }
            }
        }
    }
};
} // namespace

int main() {
    try { Overlay overlay; overlay.run(); return 0; }
    catch (const std::exception &error) { fprintf(stderr, "Huginn overlay: %s\n", error.what()); return 1; }
}
