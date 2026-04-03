using System.Security.Cryptography;
using System.Text;
using Microsoft.Win32;

namespace Guardian.Agent;

internal static class MachineKey
{
    /// <summary>
    /// Derives a 32-byte key from the Windows MachineGuid (hardware-bound for this install).
    /// </summary>
    public static byte[] DeriveAes256Key()
    {
        var guid = GetMachineGuid();
        using var sha = SHA256.Create();
        return sha.ComputeHash(Encoding.UTF8.GetBytes("Guardian.Agent|v1|" + guid));
    }

    private static string GetMachineGuid()
    {
        try
        {
            using var k = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Cryptography");
            return k?.GetValue("MachineGuid") as string ?? Environment.MachineName;
        }
        catch
        {
            return Environment.MachineName;
        }
    }
}
