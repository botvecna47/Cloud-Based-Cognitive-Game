using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices.WindowsRuntime;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Logging;
using Windows.Graphics.Imaging;
using Windows.Media.Ocr;

namespace Guardian.Agent;

public sealed class OcrManager
{
    private readonly ILogger<OcrManager> _log;

    public OcrManager(ILogger<OcrManager> log)
    {
        _log = log;
    }

    /// <summary>
    /// Captures the screen region, hashes pixels (MVP: fast checksum), runs OCR only if hash changed.
    /// </summary>
    public async Task<(string? Text, string RegionHash)> CaptureAndRecognizeIfChangedAsync(
        Rectangle screenRect,
        string previousHash,
        CancellationToken ct)
    {
        using var bmp = CaptureScreen(screenRect);
        var hash = ComputeRegionHash(bmp);
        if (hash == previousHash && !string.IsNullOrEmpty(previousHash))
            return (null, hash);

        SoftwareBitmap? software = null;
        try
        {
            software = await BitmapToSoftwareBitmapAsync(bmp, ct).ConfigureAwait(false);
            var engine = OcrEngine.TryCreateFromUserProfileLanguages();
            if (engine is null)
            {
                _log.LogWarning("OcrEngine could not be created from user languages.");
                return (null, hash);
            }

            var result = await engine.RecognizeAsync(software).AsTask().WaitAsync(ct).ConfigureAwait(false);
            var sb = new StringBuilder();
            foreach (var line in result.Lines)
            {
                sb.AppendLine(line.Text);
            }

            var text = sb.ToString().Trim();
            return (string.IsNullOrWhiteSpace(text) ? null : text, hash);
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "OCR failed.");
            return (null, hash);
        }
        finally
        {
            software?.Dispose();
        }
    }

    private static Bitmap CaptureScreen(Rectangle rect)
    {
        var bmp = new Bitmap(rect.Width, rect.Height, PixelFormat.Format32bppArgb);
        using var g = Graphics.FromImage(bmp);
        g.CopyFromScreen(rect.Left, rect.Top, 0, 0, rect.Size, CopyPixelOperation.SourceCopy);
        return bmp;
    }

    /// <summary>
    /// Fast region fingerprint: SHA256 of downscaled grayscale bytes (MVP stand-in for pHash).
    /// </summary>
    private static string ComputeRegionHash(Bitmap bmp)
    {
        const int maxW = 64;
        var scale = bmp.Width > maxW ? maxW / (double)bmp.Width : 1.0;
        var w = Math.Max(1, (int)(bmp.Width * scale));
        var h = Math.Max(1, (int)(bmp.Height * scale));
        using var small = new Bitmap(w, h, PixelFormat.Format24bppRgb);
        using (var g = Graphics.FromImage(small))
        {
            g.DrawImage(bmp, 0, 0, w, h);
        }

        var bytes = new byte[w * h];
        int i = 0;
        for (var y = 0; y < h; y++)
        {
            for (var x = 0; x < w; x++)
            {
                var c = small.GetPixel(x, y);
                bytes[i++] = (byte)((c.R * 0.299) + (c.G * 0.587) + (c.B * 0.114));
            }
        }

        var hash = SHA256.HashData(bytes);
        return Convert.ToHexString(hash);
    }

    private static async Task<SoftwareBitmap> BitmapToSoftwareBitmapAsync(Bitmap bmp, CancellationToken ct)
    {
        await using var ms = new MemoryStream();
        bmp.Save(ms, ImageFormat.Png);
        ms.Position = 0;
            var ras = ms.AsRandomAccessStream();
            var decoder = await BitmapDecoder.CreateAsync(ras).AsTask().WaitAsync(ct).ConfigureAwait(false);
            return await decoder.GetSoftwareBitmapAsync().AsTask().WaitAsync(ct).ConfigureAwait(false);
    }
}
