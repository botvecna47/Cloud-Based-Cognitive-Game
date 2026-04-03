namespace Guardian.Agent;

public sealed class GuardianOptions
{
    public const string SectionName = "Guardian";

    public string DeviceId { get; set; } = "";
    public string BrainBaseUrl { get; set; } = "http://127.0.0.1:8000";
    public string BrainApiKey { get; set; } = "";
    public int IdleThresholdSeconds { get; set; } = 120;
    public int MinOcrIntervalMs { get; set; } = 500;
    public int MaxOcrPerSecond { get; set; } = 2;
    public WhitelistOptions Whitelist { get; set; } = new();
    public ScreenRegionOptions ScreenRegion { get; set; } = new();
    public string QueueDirectory { get; set; } = "";
    public EncryptionOptions Encryption { get; set; } = new();
}

public sealed class WhitelistOptions
{
    public List<string> ProcessNameSubstrings { get; set; } = new();
    public List<string> WindowTitleSubstrings { get; set; } = new();
}

public sealed class ScreenRegionOptions
{
    public int Left { get; set; }
    public int Top { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
}

public sealed class EncryptionOptions
{
    public bool Enabled { get; set; } = true;
}
