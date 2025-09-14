using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class Item
{
    public int Id { get; set; }

    [Required, MaxLength(128)]
    public string Code { get; set; } = string.Empty;

    [MaxLength(256)]
    public string? Description { get; set; }

    

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}