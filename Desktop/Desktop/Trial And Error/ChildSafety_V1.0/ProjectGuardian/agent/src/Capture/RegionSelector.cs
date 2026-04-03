using System.Drawing;
using Microsoft.Extensions.Options;

namespace Guardian.Agent;

public sealed class RegionSelector
{
    private readonly GuardianOptions _options;

    public RegionSelector(IOptions<GuardianOptions> options)
    {
        _options = options.Value;
    }

    /// <summary>
    /// Returns the configured screen rectangle (absolute coordinates) for zonal OCR.
    /// </summary>
    public Rectangle GetCaptureRectangle()
    {
        var r = _options.ScreenRegion;
        return new Rectangle(r.Left, r.Top, Math.Max(1, r.Width), Math.Max(1, r.Height));
    }
}
