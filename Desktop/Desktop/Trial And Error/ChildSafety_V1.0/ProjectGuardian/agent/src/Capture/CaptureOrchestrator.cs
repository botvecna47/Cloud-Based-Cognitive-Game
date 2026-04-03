using Microsoft.Extensions.Options;

namespace Guardian.Agent;

public sealed class CaptureOrchestrator
{
    private readonly ForegroundWindowWatcher _watcher;
    private readonly RegionSelector _region;
    private readonly OcrManager _ocr;
    private readonly LocalQueue _queue;
    private readonly UploadClient _upload;
    private readonly GuardianOptions _options;

    private string _lastHash = "";
    private DateTime _lastOcrUtc = DateTime.MinValue;

    public CaptureOrchestrator(
        ForegroundWindowWatcher watcher,
        RegionSelector region,
        OcrManager ocr,
        LocalQueue queue,
        UploadClient upload,
        IOptions<GuardianOptions> options)
    {
        _watcher = watcher;
        _region = region;
        _ocr = ocr;
        _queue = queue;
        _upload = upload;
        _options = options.Value;
    }

    /// <summary>
    /// One tick: whitelist + idle gate + throttle + region hash gate; then OCR and enqueue/upload.
    /// </summary>
    public async Task TickAsync(CancellationToken ct)
    {
        var idle = IdleDetector.GetIdleTime();
        if (idle.TotalSeconds > _options.IdleThresholdSeconds)
            return;

        var fg = _watcher.GetForegroundInfo();
        if (fg is null || !_watcher.IsWhitelisted(fg.Value))
            return;

        var minInterval = TimeSpan.FromMilliseconds(Math.Max(50, _options.MinOcrIntervalMs));
        var maxPerSec = Math.Max(1, _options.MaxOcrPerSecond);
        var effectiveMin = TimeSpan.FromTicks(Math.Max(minInterval.Ticks, TimeSpan.FromSeconds(1.0 / maxPerSec).Ticks));

        if (DateTime.UtcNow - _lastOcrUtc < effectiveMin)
            return;

        var rect = _region.GetCaptureRectangle();
        var (text, regionHash) = await _ocr.CaptureAndRecognizeIfChangedAsync(rect, _lastHash, ct).ConfigureAwait(false);
        if (text is null)
            return;

        _lastHash = regionHash;
        _lastOcrUtc = DateTime.UtcNow;

        var payload = new AnalyzePayload(
            _options.DeviceId,
            DateTime.UtcNow,
            Truncate(fg.Value.WindowTitle, 200),
            fg.Value.ProcessName,
            text,
            regionHash);

        await _queue.EnqueueAsync(payload, ct).ConfigureAwait(false);
        await _upload.FlushQueueAsync(ct).ConfigureAwait(false);
    }

    private static string Truncate(string s, int max)
    {
        if (string.IsNullOrEmpty(s) || s.Length <= max) return s;
        return s[..max];
    }
}
