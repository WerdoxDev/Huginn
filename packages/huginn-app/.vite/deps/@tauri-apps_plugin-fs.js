import {
  BaseDirectory
} from "./chunk-ZNFAJ4U2.js";
import {
  Channel,
  Resource,
  invoke
} from "./chunk-NSSZRN4Z.js";
import "./chunk-RDKGUBC5.js";

// ../../node_modules/.deno/@tauri-apps+plugin-fs@2.0.0/node_modules/@tauri-apps/plugin-fs/dist-js/index.js
var SeekMode;
(function(SeekMode2) {
  SeekMode2[SeekMode2["Start"] = 0] = "Start";
  SeekMode2[SeekMode2["Current"] = 1] = "Current";
  SeekMode2[SeekMode2["End"] = 2] = "End";
})(SeekMode || (SeekMode = {}));
function parseFileInfo(r) {
  return {
    isFile: r.isFile,
    isDirectory: r.isDirectory,
    isSymlink: r.isSymlink,
    size: r.size,
    mtime: r.mtime !== null ? new Date(r.mtime) : null,
    atime: r.atime !== null ? new Date(r.atime) : null,
    birthtime: r.birthtime !== null ? new Date(r.birthtime) : null,
    readonly: r.readonly,
    fileAttributes: r.fileAttributes,
    dev: r.dev,
    ino: r.ino,
    mode: r.mode,
    nlink: r.nlink,
    uid: r.uid,
    gid: r.gid,
    rdev: r.rdev,
    blksize: r.blksize,
    blocks: r.blocks
  };
}
var FileHandle = class extends Resource {
  /**
   * Reads up to `p.byteLength` bytes into `p`. It resolves to the number of
   * bytes read (`0` < `n` <= `p.byteLength`) and rejects if any error
   * encountered. Even if `read()` resolves to `n` < `p.byteLength`, it may
   * use all of `p` as scratch space during the call. If some data is
   * available but not `p.byteLength` bytes, `read()` conventionally resolves
   * to what is available instead of waiting for more.
   *
   * When `read()` encounters end-of-file condition, it resolves to EOF
   * (`null`).
   *
   * When `read()` encounters an error, it rejects with an error.
   *
   * Callers should always process the `n` > `0` bytes returned before
   * considering the EOF (`null`). Doing so correctly handles I/O errors that
   * happen after reading some bytes and also both of the allowed EOF
   * behaviors.
   *
   * @example
   * ```typescript
   * import { open, BaseDirectory } from "@tauri-apps/plugin-fs"
   * // if "$APPCONFIG/foo/bar.txt" contains the text "hello world":
   * const file = await open("foo/bar.txt", { baseDir: BaseDirectory.AppConfig });
   * const buf = new Uint8Array(100);
   * const numberOfBytesRead = await file.read(buf); // 11 bytes
   * const text = new TextDecoder().decode(buf);  // "hello world"
   * await file.close();
   * ```
   *
   * @since 2.0.0
   */
  async read(buffer) {
    if (buffer.byteLength === 0) {
      return 0;
    }
    const [data, nread] = await invoke("plugin:fs|read", {
      rid: this.rid,
      len: buffer.byteLength
    });
    buffer.set(data);
    return nread === 0 ? null : nread;
  }
  /**
   * Seek sets the offset for the next `read()` or `write()` to offset,
   * interpreted according to `whence`: `Start` means relative to the
   * start of the file, `Current` means relative to the current offset,
   * and `End` means relative to the end. Seek resolves to the new offset
   * relative to the start of the file.
   *
   * Seeking to an offset before the start of the file is an error. Seeking to
   * any positive offset is legal, but the behavior of subsequent I/O
   * operations on the underlying object is implementation-dependent.
   * It returns the number of cursor position.
   *
   * @example
   * ```typescript
   * import { open, SeekMode, BaseDirectory } from '@tauri-apps/plugin-fs';
   *
   * // Given hello.txt pointing to file with "Hello world", which is 11 bytes long:
   * const file = await open('hello.txt', { read: true, write: true, truncate: true, create: true, baseDir: BaseDirectory.AppLocalData });
   * await file.write(new TextEncoder().encode("Hello world"));
   *
   * // Seek 6 bytes from the start of the file
   * console.log(await file.seek(6, SeekMode.Start)); // "6"
   * // Seek 2 more bytes from the current position
   * console.log(await file.seek(2, SeekMode.Current)); // "8"
   * // Seek backwards 2 bytes from the end of the file
   * console.log(await file.seek(-2, SeekMode.End)); // "9" (e.g. 11-2)
   *
   * await file.close();
   * ```
   *
   * @since 2.0.0
   */
  async seek(offset, whence) {
    return await invoke("plugin:fs|seek", {
      rid: this.rid,
      offset,
      whence
    });
  }
  /**
   * Returns a {@linkcode FileInfo } for this file.
   *
   * @example
   * ```typescript
   * import { open, BaseDirectory } from '@tauri-apps/plugin-fs';
   * const file = await open("file.txt", { read: true, baseDir: BaseDirectory.AppLocalData });
   * const fileInfo = await file.stat();
   * console.log(fileInfo.isFile); // true
   * await file.close();
   * ```
   *
   * @since 2.0.0
   */
  async stat() {
    const res = await invoke("plugin:fs|fstat", {
      rid: this.rid
    });
    return parseFileInfo(res);
  }
  /**
   * Truncates or extends this file, to reach the specified `len`.
   * If `len` is not specified then the entire file contents are truncated.
   *
   * @example
   * ```typescript
   * import { open, BaseDirectory } from '@tauri-apps/plugin-fs';
   *
   * // truncate the entire file
   * const file = await open("my_file.txt", { read: true, write: true, create: true, baseDir: BaseDirectory.AppLocalData });
   * await file.truncate();
   *
   * // truncate part of the file
   * const file = await open("my_file.txt", { read: true, write: true, create: true, baseDir: BaseDirectory.AppLocalData });
   * await file.write(new TextEncoder().encode("Hello World"));
   * await file.truncate(7);
   * const data = new Uint8Array(32);
   * await file.read(data);
   * console.log(new TextDecoder().decode(data)); // Hello W
   * await file.close();
   * ```
   *
   * @since 2.0.0
   */
  async truncate(len) {
    await invoke("plugin:fs|ftruncate", {
      rid: this.rid,
      len
    });
  }
  /**
   * Writes `p.byteLength` bytes from `p` to the underlying data stream. It
   * resolves to the number of bytes written from `p` (`0` <= `n` <=
   * `p.byteLength`) or reject with the error encountered that caused the
   * write to stop early. `write()` must reject with a non-null error if
   * would resolve to `n` < `p.byteLength`. `write()` must not modify the
   * slice data, even temporarily.
   *
   * @example
   * ```typescript
   * import { open, write, BaseDirectory } from '@tauri-apps/plugin-fs';
   * const encoder = new TextEncoder();
   * const data = encoder.encode("Hello world");
   * const file = await open("bar.txt", { write: true, baseDir: BaseDirectory.AppLocalData });
   * const bytesWritten = await file.write(data); // 11
   * await file.close();
   * ```
   *
   * @since 2.0.0
   */
  async write(data) {
    return await invoke("plugin:fs|write", {
      rid: this.rid,
      data
    });
  }
};
async function create(path, options) {
  if (path instanceof URL && path.protocol !== "file:") {
    throw new TypeError("Must be a file URL.");
  }
  const rid = await invoke("plugin:fs|create", {
    path: path instanceof URL ? path.toString() : path,
    options
  });
  return new FileHandle(rid);
}
async function open(path, options) {
  if (path instanceof URL && path.protocol !== "file:") {
    throw new TypeError("Must be a file URL.");
  }
  const rid = await invoke("plugin:fs|open", {
    path: path instanceof URL ? path.toString() : path,
    options
  });
  return new FileHandle(rid);
}
async function copyFile(fromPath, toPath, options) {
  if (fromPath instanceof URL && fromPath.protocol !== "file:" || toPath instanceof URL && toPath.protocol !== "file:") {
    throw new TypeError("Must be a file URL.");
  }
  await invoke("plugin:fs|copy_file", {
    fromPath: fromPath instanceof URL ? fromPath.toString() : fromPath,
    toPath: toPath instanceof URL ? toPath.toString() : toPath,
    options
  });
}
async function mkdir(path, options) {
  if (path instanceof URL && path.protocol !== "file:") {
    throw new TypeError("Must be a file URL.");
  }
  await invoke("plugin:fs|mkdir", {
    path: path instanceof URL ? path.toString() : path,
    options
  });
}
async function readDir(path, options) {
  if (path instanceof URL && path.protocol !== "file:") {
    throw new TypeError("Must be a file URL.");
  }
  return await invoke("plugin:fs|read_dir", {
    path: path instanceof URL ? path.toString() : path,
    options
  });
}
async function readFile(path, options) {
  if (path instanceof URL && path.protocol !== "file:") {
    throw new TypeError("Must be a file URL.");
  }
  const arr = await invoke("plugin:fs|read_file", {
    path: path instanceof URL ? path.toString() : path,
    options
  });
  return arr instanceof ArrayBuffer ? new Uint8Array(arr) : Uint8Array.from(arr);
}
async function readTextFile(path, options) {
  if (path instanceof URL && path.protocol !== "file:") {
    throw new TypeError("Must be a file URL.");
  }
  return await invoke("plugin:fs|read_text_file", {
    path: path instanceof URL ? path.toString() : path,
    options
  });
}
async function readTextFileLines(path, options) {
  if (path instanceof URL && path.protocol !== "file:") {
    throw new TypeError("Must be a file URL.");
  }
  const pathStr = path instanceof URL ? path.toString() : path;
  return await Promise.resolve({
    path: pathStr,
    rid: null,
    async next() {
      if (this.rid === null) {
        this.rid = await invoke("plugin:fs|read_text_file_lines", {
          path: pathStr,
          options
        });
      }
      const [line, done] = await invoke("plugin:fs|read_text_file_lines_next", { rid: this.rid });
      if (done)
        this.rid = null;
      return {
        value: done ? "" : line,
        done
      };
    },
    [Symbol.asyncIterator]() {
      return this;
    }
  });
}
async function remove(path, options) {
  if (path instanceof URL && path.protocol !== "file:") {
    throw new TypeError("Must be a file URL.");
  }
  await invoke("plugin:fs|remove", {
    path: path instanceof URL ? path.toString() : path,
    options
  });
}
async function rename(oldPath, newPath, options) {
  if (oldPath instanceof URL && oldPath.protocol !== "file:" || newPath instanceof URL && newPath.protocol !== "file:") {
    throw new TypeError("Must be a file URL.");
  }
  await invoke("plugin:fs|rename", {
    oldPath: oldPath instanceof URL ? oldPath.toString() : oldPath,
    newPath: newPath instanceof URL ? newPath.toString() : newPath,
    options
  });
}
async function stat(path, options) {
  const res = await invoke("plugin:fs|stat", {
    path: path instanceof URL ? path.toString() : path,
    options
  });
  return parseFileInfo(res);
}
async function lstat(path, options) {
  const res = await invoke("plugin:fs|lstat", {
    path: path instanceof URL ? path.toString() : path,
    options
  });
  return parseFileInfo(res);
}
async function truncate(path, len, options) {
  if (path instanceof URL && path.protocol !== "file:") {
    throw new TypeError("Must be a file URL.");
  }
  await invoke("plugin:fs|truncate", {
    path: path instanceof URL ? path.toString() : path,
    len,
    options
  });
}
async function writeFile(path, data, options) {
  if (path instanceof URL && path.protocol !== "file:") {
    throw new TypeError("Must be a file URL.");
  }
  await invoke("plugin:fs|write_file", data, {
    headers: {
      path: encodeURIComponent(path instanceof URL ? path.toString() : path),
      options: JSON.stringify(options)
    }
  });
}
async function writeTextFile(path, data, options) {
  if (path instanceof URL && path.protocol !== "file:") {
    throw new TypeError("Must be a file URL.");
  }
  await invoke("plugin:fs|write_text_file", {
    path: path instanceof URL ? path.toString() : path,
    data,
    options
  });
}
async function exists(path, options) {
  if (path instanceof URL && path.protocol !== "file:") {
    throw new TypeError("Must be a file URL.");
  }
  return await invoke("plugin:fs|exists", {
    path: path instanceof URL ? path.toString() : path,
    options
  });
}
async function unwatch(rid) {
  await invoke("plugin:fs|unwatch", { rid });
}
async function watch(paths, cb, options) {
  const opts = {
    recursive: false,
    delayMs: 2e3,
    ...options
  };
  const watchPaths = Array.isArray(paths) ? paths : [paths];
  for (const path of watchPaths) {
    if (path instanceof URL && path.protocol !== "file:") {
      throw new TypeError("Must be a file URL.");
    }
  }
  const onEvent = new Channel();
  onEvent.onmessage = cb;
  const rid = await invoke("plugin:fs|watch", {
    paths: watchPaths.map((p) => p instanceof URL ? p.toString() : p),
    options: opts,
    onEvent
  });
  return () => {
    void unwatch(rid);
  };
}
async function watchImmediate(paths, cb, options) {
  const opts = {
    recursive: false,
    ...options,
    delayMs: null
  };
  const watchPaths = Array.isArray(paths) ? paths : [paths];
  for (const path of watchPaths) {
    if (path instanceof URL && path.protocol !== "file:") {
      throw new TypeError("Must be a file URL.");
    }
  }
  const onEvent = new Channel();
  onEvent.onmessage = cb;
  const rid = await invoke("plugin:fs|watch", {
    paths: watchPaths.map((p) => p instanceof URL ? p.toString() : p),
    options: opts,
    onEvent
  });
  return () => {
    void unwatch(rid);
  };
}
export {
  BaseDirectory,
  FileHandle,
  SeekMode,
  copyFile,
  create,
  exists,
  lstat,
  mkdir,
  open,
  readDir,
  readFile,
  readTextFile,
  readTextFileLines,
  remove,
  rename,
  stat,
  truncate,
  watch,
  watchImmediate,
  writeFile,
  writeTextFile
};
//# sourceMappingURL=@tauri-apps_plugin-fs.js.map
