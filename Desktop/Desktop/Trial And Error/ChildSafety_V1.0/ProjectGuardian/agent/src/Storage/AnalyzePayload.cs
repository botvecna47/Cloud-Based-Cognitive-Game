namespace Guardian.Agent;

public sealed record AnalyzePayload(
    string DeviceId,
    DateTime CapturedAt,
    string WindowTitle,
    string ProcessName,
    string Text,
    string RegionHash);
