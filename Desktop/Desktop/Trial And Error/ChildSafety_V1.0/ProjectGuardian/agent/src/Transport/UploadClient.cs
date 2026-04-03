using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Guardian.Agent;

public sealed class UploadClient
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly GuardianOptions _options;
    private readonly LocalQueue _queue;
    private readonly ILogger<UploadClient> _log;

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true
    };

    public UploadClient(
        IHttpClientFactory httpFactory,
        IOptions<GuardianOptions> options,
        LocalQueue queue,
        ILogger<UploadClient> log)
    {
        _httpFactory = httpFactory;
        _options = options.Value;
        _queue = queue;
        _log = log;
    }

    public async Task FlushQueueAsync(CancellationToken ct)
    {
        var pending = await _queue.DequeueAllAsync(ct).ConfigureAwait(false);
        if (pending.Count == 0)
            return;

        var http = _httpFactory.CreateClient("brain");
        var failed = new List<AnalyzePayload>();
        foreach (var p in pending)
        {
            try
            {
                using var req = new HttpRequestMessage(HttpMethod.Post, "analyze");
                req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.BrainApiKey);
                req.Content = JsonContent.Create(p, options: JsonOpts);

                var resp = await http.SendAsync(req, ct).ConfigureAwait(false);
                if (!resp.IsSuccessStatusCode)
                {
                    _log.LogWarning("Brain returned {Status} for analyze.", resp.StatusCode);
                    failed.Add(p);
                }
            }
            catch (Exception ex)
            {
                _log.LogWarning(ex, "Upload failed; will re-queue.");
                failed.Add(p);
            }

            await Task.Delay(50, ct).ConfigureAwait(false);
        }

        foreach (var p in failed)
        {
            await _queue.EnqueueAsync(p, ct).ConfigureAwait(false);
        }
    }
}
