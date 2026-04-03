using System.Runtime.InteropServices;

namespace Guardian.Agent;

public static class IdleDetector
{
    public static TimeSpan GetIdleTime()
    {
        var lii = new LASTINPUTINFO { cbSize = (uint)Marshal.SizeOf<LASTINPUTINFO>() };
        if (!GetLastInputInfo(ref lii))
            return TimeSpan.Zero;

        var tickCount = Environment.TickCount64;
        var idleMs = tickCount - lii.dwTime;
        if (idleMs < 0)
            idleMs = 0;
        return TimeSpan.FromMilliseconds(idleMs);
    }

    [DllImport("user32.dll")]
    private static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);

    [StructLayout(LayoutKind.Sequential)]
    private struct LASTINPUTINFO
    {
        public uint cbSize;
        public uint dwTime;
    }
}
