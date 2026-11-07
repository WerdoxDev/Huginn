$ErrorActionPreference = 'Stop'

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public static class ListenerTestWindow {
    [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern IntPtr CreateWindowExW(uint exStyle, string className, string title,
        uint style, int x, int y, int width, int height, IntPtr parent,
        IntPtr menu, IntPtr instance, IntPtr param);

    [DllImport("user32.dll", SetLastError = true)]
    static extern bool SetWindowPos(IntPtr hwnd, IntPtr after, int x, int y,
        int width, int height, uint flags);

    [DllImport("user32.dll")]
    static extern bool DestroyWindow(IntPtr hwnd);

    [DllImport("user32.dll")]
    static extern bool SetForegroundWindow(IntPtr hwnd);

    [DllImport("user32.dll")]
    static extern bool ShowWindow(IntPtr hwnd, int command);

    [StructLayout(LayoutKind.Sequential)]
    struct Rect { public int left, top, right, bottom; }

    [StructLayout(LayoutKind.Sequential)]
    struct Point { public int x, y; }

    [DllImport("user32.dll")]
    static extern bool GetClientRect(IntPtr hwnd, out Rect rect);

    [DllImport("user32.dll")]
    static extern bool ClientToScreen(IntPtr hwnd, ref Point point);

    public static void Run() {
        IntPtr hwnd = CreateWindowExW(0, "STATIC", "Huginn window listener test",
            0x10CF0000, 100, 100, 320, 240, IntPtr.Zero, IntPtr.Zero, IntPtr.Zero, IntPtr.Zero);
        if (hwnd == IntPtr.Zero) throw new System.ComponentModel.Win32Exception();
        IntPtr other = IntPtr.Zero;
        Console.WriteLine(hwnd.ToInt64());
        try {
            string command;
            while ((command = Console.ReadLine()) != null) {
                if (command == "close") break;
                if (command == "focus" || command == "blur") {
                    if (command == "blur" && other == IntPtr.Zero) {
                        other = CreateWindowExW(0x80, "STATIC", "Huginn focus test companion",
                            0x80000000, 450, 100, 100, 100, IntPtr.Zero, IntPtr.Zero, IntPtr.Zero, IntPtr.Zero);
                        if (other == IntPtr.Zero) throw new System.ComponentModel.Win32Exception();
                        ShowWindow(other, 4);
                    }
                    if (!SetForegroundWindow(command == "focus" ? hwnd : other))
                        throw new InvalidOperationException("Focus test requires permission to activate its windows");
                    Console.WriteLine("focused");
                    continue;
                }
                string[] bounds = command.Split(' ');
                if (!SetWindowPos(hwnd, IntPtr.Zero, Int32.Parse(bounds[0]), Int32.Parse(bounds[1]),
                    Int32.Parse(bounds[2]), Int32.Parse(bounds[3]), 0x14))
                    throw new System.ComponentModel.Win32Exception();
                Rect rect;
                Point origin = new Point();
                if (!GetClientRect(hwnd, out rect) || !ClientToScreen(hwnd, ref origin))
                    throw new System.ComponentModel.Win32Exception();
                Console.WriteLine("changed {0} {1} {2} {3}", origin.x, origin.y,
                    rect.right - rect.left, rect.bottom - rect.top);
            }
        } finally {
            DestroyWindow(hwnd);
            if (other != IntPtr.Zero) DestroyWindow(other);
        }
    }
}
'@

[ListenerTestWindow]::Run()
