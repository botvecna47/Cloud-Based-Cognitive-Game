using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Guardian.Agent;

public sealed class AgentWorker : BackgroundService
{
    private readonly CaptureOrchestrator _orchestrator;
    private readonly ILogger<AgentWorker> _log;

    public AgentWorker(CaptureOrchestrator orchestrator, ILogger<AgentWorker> log)
    {
        _orchestrator = orchestrator;
        _log = log;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _log.LogInformation("Guardian Agent started. Zonal OCR + whitelist active.");
        using var timer = new PeriodicTimer(TimeSpan.FromMilliseconds(250));
        while (await timer.WaitForNextTickAsync(stoppingToken).ConfigureAwait(false))
        {
            try
            {
                await _orchestrator.TickAsync(stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _log.LogError(ex, "Tick failed.");
            }
        }
    }
}
