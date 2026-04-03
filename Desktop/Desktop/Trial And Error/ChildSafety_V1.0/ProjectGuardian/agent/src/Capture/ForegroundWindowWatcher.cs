using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using Microsoft.Extensions.Options;

namespace Guardian.Agent;

public sealed class ForegroundWindowWatcher
{
    private readonly GuardianOptions _options;

    public ForegroundWindowWatcher(IOptions<GuardianOptions> options)
    {
        _options = options.Value;
    }

    public ForegroundInfo? GetForegroundInfo()
    {
        var hwnd = GetForegroundWindow();
        if (hwnd == IntPtr.Zero)
            return null;

        var title = GetWindowTitle(hwnd);
        uint pid = 0;
        _ = GetWindowThreadProcessId(hwnd, out pid);
        string processName = "";
        try
        {
            if (pid != 0)
                processName = Process.GetProcessById((int)pid).ProcessName;
        }
        catch
        {
            processName = "";
        }

        return new ForegroundInfo(hwnd, title, processName, pid);
    }

    public bool IsWhitelisted(ForegroundInfo info)
    {
        var p = _options.Whitelist.ProcessNameSubstrings;
        var t = _options.Whitelist.WindowTitleSubstrings;
        if (p.Count == 0 && t.Count == 0)
            return true;

        foreach (var s in p)
        {
            if (info.ProcessName.Contains(s, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        foreach (var s in t)
        {
            if (info.WindowTitle.Contains(s, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    private static string GetWindowTitle(IntPtr hwnd)
    {
        const int max = 512;
        var sb = new StringBuilder(max);
        _ = GetWindowText(hwnd, sb, max);
        return sb.ToString();
    }

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    private static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
}

public readonly record struct ForegroundInfo(IntPtr Hwnd, string WindowTitle, string ProcessName, uint ProcessId);
