using Microsoft.Extensions.Logging;
using Microsoft.Win32;

namespace Guardian.Agent;

/// <summary>
/// Optional: register the agent under HKCU Run for visible per-user startup (demo only).
/// </summary>
public static class RunKeyHelper
{
    private const string RunKey = @"Software\Microsoft\Windows\CurrentVersion\Run";

    public static void Register(string appName, string executablePath, ILogger? log = null)
    {
        using var key = Registry.CurrentUser.CreateSubKey(RunKey, true);
        key?.SetValue(appName, $"\"{executablePath}\"");
        log?.LogInformation("Registered HKCU Run entry: {Name}", appName);
    }

    public static void Unregister(string appName, ILogger? log = null)
    {
        using var key = Registry.CurrentUser.OpenSubKey(RunKey, true);
        key?.DeleteValue(appName, false);
        log?.LogInformation("Removed HKCU Run entry: {Name}", appName);
    }
}
