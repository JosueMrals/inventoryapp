using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

[Route("api/[controller]")]
[ApiController]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public ProductsController(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    // GET: api/products
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<Product>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<Product>>> GetProducts()
    {
        var products = await _context.Products.AsNoTracking().ToListAsync();
        return Ok(products);
    }

    // GET: api/products/{id}
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(Product), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Product>> GetProduct(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();
        return Ok(product);
    }

    // POST: api/products
    [HttpPost]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(Product), StatusCodes.Status201Created)]
    public async Task<ActionResult<Product>> CreateProduct([FromForm] ProductCreateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var product = new Product
        {
            Name = dto.Name,
            Price = dto.Price,
            Description = dto.Description,
            Barcode = dto.Barcode
        };

        if (dto.ImageUrl != null && dto.ImageUrl.Length > 0)
        {
            var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(dto.ImageUrl.FileName)}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            await using var stream = new FileStream(filePath, FileMode.Create);
            await dto.ImageUrl.CopyToAsync(stream);

            product.ImageUrl = $"/uploads/{fileName}";
        }

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
    }

    // PUT: api/products/{id}
    [HttpPut("{id:int}")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(Product), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Product>> UpdateProduct(int id, [FromForm] ProductCreateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();

        product.Name = dto.Name;
        product.Price = dto.Price;
        product.Description = dto.Description;
        product.Barcode = dto.Barcode;

        if (dto.ImageUrl != null && dto.ImageUrl.Length > 0)
        {
            // Eliminar imagen anterior si existía
            if (!string.IsNullOrWhiteSpace(product.ImageUrl))
            {
                var oldPath = Path.Combine(_env.WebRootPath, product.ImageUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                if (System.IO.File.Exists(oldPath))
                {
                    try { System.IO.File.Delete(oldPath); } catch { /* log optional */ }
                }
            }

            var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(dto.ImageUrl.FileName)}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            await using var stream = new FileStream(filePath, FileMode.Create);
            await dto.ImageUrl.CopyToAsync(stream);

            product.ImageUrl = $"/uploads/{fileName}";
        }

        await _context.SaveChangesAsync();
        return Ok(product);
    }

    // DELETE: api/products/{id}
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();

        // Eliminar imagen asociada si existe
        if (!string.IsNullOrWhiteSpace(product.ImageUrl))
        {
            var path = Path.Combine(_env.WebRootPath, product.ImageUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
            if (System.IO.File.Exists(path))
            {
                try { System.IO.File.Delete(path); } catch { /* log optional */ }
            }
        }

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

// DTO para crear/actualizar producto
public class ProductCreateDto
{
    public string Name { get; set; } = "";
    public decimal Price { get; set; } // Ojo con cultura (ver nota abajo)
    public string? Description { get; set; }
    public string? Barcode { get; set; }
    public IFormFile? ImageUrl { get; set; }
}