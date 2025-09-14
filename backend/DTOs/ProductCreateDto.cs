namespace Backend.DTOs;

public class ProductCreateDto
{
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }

    public string? Description { get; set; }
    public string? Barcode { get; set; }

    public IFormFile? ImageUrl { get; set; }
}

public class ProductUpdateDto
{
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }

    public string? Description { get; set; }
    public string? Barcode { get; set; }

    public IFormFile? ImageUrl { get; set; }
}
