using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace Guardian.Agent;

public sealed class LocalQueue
{
    private readonly GuardianOptions _options;
    private readonly string _queueFile;
    private readonly SemaphoreSlim _lock = new(1, 1);

    public LocalQueue(IOptions<GuardianOptions> options)
    {
        _options = options.Value;
        var dir = string.IsNullOrWhiteSpace(_options.QueueDirectory)
            ? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Guardian", "queue")
            : _options.QueueDirectory;
        Directory.CreateDirectory(dir);
        _queueFile = Path.Combine(dir, _options.Encryption.Enabled ? "pending.jsonl.enc" : "pending.jsonl");
    }

    public async Task EnqueueAsync(AnalyzePayload payload, CancellationToken ct)
    {
        var json = JsonSerializer.Serialize(payload);
        var line = _options.Encryption.Enabled
            ? EncryptLine(json)
            : json;

        await _lock.WaitAsync(ct).ConfigureAwait(false);
        try
        {
            await File.AppendAllTextAsync(_queueFile, line + Environment.NewLine, ct).ConfigureAwait(false);
            TrimIfNeeded();
        }
        finally
        {
            _lock.Release();
        }
    }

    /// <summary>
    /// Reads all pending lines (decrypts if encrypted), clears file.
    /// </summary>
    public async Task<IReadOnlyList<AnalyzePayload>> DequeueAllAsync(CancellationToken ct)
    {
        await _lock.WaitAsync(ct).ConfigureAwait(false);
        try
        {
            if (!File.Exists(_queueFile))
                return Array.Empty<AnalyzePayload>();

            var text = await File.ReadAllTextAsync(_queueFile, ct).ConfigureAwait(false);
            if (string.IsNullOrWhiteSpace(text))
                return Array.Empty<AnalyzePayload>();

            var lines = text.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
            var list = new List<AnalyzePayload>();
            foreach (var line in lines)
            {
                var json = _options.Encryption.Enabled ? DecryptLine(line) : line;
                if (json is null) continue;
                var p = JsonSerializer.Deserialize<AnalyzePayload>(json);
                if (p is not null)
                    list.Add(p);
            }

            File.Delete(_queueFile);
            return list;
        }
        finally
        {
            _lock.Release();
        }
    }

    private void TrimIfNeeded()
    {
        try
        {
            var fi = new FileInfo(_queueFile);
            if (!fi.Exists || fi.Length <= 5 * 1024 * 1024)
                return;

            // Drop oldest half: simplistic truncate for MVP
            var lines = File.ReadAllLines(_queueFile);
            var keep = lines.Skip(lines.Length / 2).ToArray();
            File.WriteAllLines(_queueFile, keep);
        }
        catch
        {
            /* best effort */
        }
    }

    private static string EncryptLine(string plain)
    {
        var key = MachineKey.DeriveAes256Key();
        var nonce = RandomNumberGenerator.GetBytes(12);
        var plainBytes = Encoding.UTF8.GetBytes(plain);
        var cipher = new byte[plainBytes.Length];
        var tag = new byte[16];
        using (var aes = new AesGcm(key, 16))
        {
            aes.Encrypt(nonce, plainBytes, cipher, tag);
        }

        var blob = new byte[nonce.Length + cipher.Length + tag.Length];
        Buffer.BlockCopy(nonce, 0, blob, 0, nonce.Length);
        Buffer.BlockCopy(cipher, 0, blob, nonce.Length, cipher.Length);
        Buffer.BlockCopy(tag, 0, blob, nonce.Length + cipher.Length, tag.Length);
        return Convert.ToBase64String(blob);
    }

    private static string? DecryptLine(string b64)
    {
        try
        {
            var blob = Convert.FromBase64String(b64);
            if (blob.Length < 12 + 16)
                return null;
            var nonce = blob.AsSpan(0, 12);
            var tag = blob.AsSpan(blob.Length - 16, 16);
            var cipher = blob.AsSpan(12, blob.Length - 12 - 16);
            var key = MachineKey.DeriveAes256Key();
            var plain = new byte[cipher.Length];
            using (var aes = new AesGcm(key, 16))
            {
                aes.Decrypt(nonce, cipher, tag, plain);
            }

            return Encoding.UTF8.GetString(plain);
        }
        catch
        {
            return null;
        }
    }
}
