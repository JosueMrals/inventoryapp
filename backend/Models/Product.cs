using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class Product
{
    public int Id { get; set; }

    [Required, StringLength(100, MinimumLength = 3)]
    public string Name { get; set; } = string.Empty;

    [Range(0.01, double.MaxValue, ErrorMessage = "El precio debe ser mayor a 0.")]
    public decimal Price { get; set; }
    public string Barcode { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
}
