using Guardian.Agent;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = Host.CreateApplicationBuilder(args);
builder.Environment.ContentRootPath = AppContext.BaseDirectory;

builder.Services.Configure<GuardianOptions>(
    builder.Configuration.GetSection(GuardianOptions.SectionName));

builder.Services.AddHttpClient("brain", (sp, client) =>
{
    var o = sp.GetRequiredService<IOptions<GuardianOptions>>().Value;
    client.BaseAddress = new Uri(o.BrainBaseUrl.TrimEnd('/') + "/");
    client.Timeout = TimeSpan.FromSeconds(60);
});

builder.Services.AddSingleton<ForegroundWindowWatcher>();
builder.Services.AddSingleton<RegionSelector>();
builder.Services.AddSingleton<OcrManager>();
builder.Services.AddSingleton<LocalQueue>();
builder.Services.AddSingleton<UploadClient>();
builder.Services.AddSingleton<CaptureOrchestrator>();
builder.Services.AddHostedService<AgentWorker>();

var host = builder.Build();
await host.RunAsync();
