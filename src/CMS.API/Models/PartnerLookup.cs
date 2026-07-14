namespace CMS.API.Models;

/// <summary>Slim lookup row for the Partner dropdown (e.g. the Course / Certification ↔ Partner FK).</summary>
public class PartnerLookup
{
    public short Pkid { get; set; }
    public string Name { get; set; } = string.Empty;
}
