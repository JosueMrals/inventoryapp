using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InventoryApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProductsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/products
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Product>>> GetProducts()
        {
            return await _context.Products.AsNoTracking().ToListAsync();
        }

        // GET: api/products/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Product>> GetProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);

            if (product == null) return NotFound();

            return product;
        }

        // POST: api/products
        [HttpPost]
        public async Task<ActionResult<Product>> CreateProduct(Product product)
        {
            // Validaciones básicas
            if (string.IsNullOrWhiteSpace(product.Name))
                return BadRequest("El nombre es obligatorio.");

            if (product.Price <= 0)
                return BadRequest("El precio debe ser mayor a 0.");

            if (string.IsNullOrWhiteSpace(product.Barcode))
                return BadRequest("El código de barras es obligatorio.");

            // Opcional: verificar si ya existe el mismo código de barras
            var exists = await _context.Products
                .AnyAsync(p => p.Barcode == product.Barcode);

            if (exists)
                return Conflict("Ya existe un producto con ese código de barras.");

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
        }

        // PUT: api/products/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProduct(int id, Product product)
        {
            if (id != product.Id)
                return BadRequest("El ID no coincide.");

            if (string.IsNullOrWhiteSpace(product.Name))
                return BadRequest("El nombre es obligatorio.");

            if (product.Price <= 0)
                return BadRequest("El precio debe ser mayor a 0.");

            if (string.IsNullOrWhiteSpace(product.Barcode))
                return BadRequest("El código de barras es obligatorio.");

            // Validar duplicados de código de barras (excepto el propio)
            var duplicate = await _context.Products
                .AnyAsync(p => p.Barcode == product.Barcode && p.Id != product.Id);

            if (duplicate)
                return Conflict("Ya existe otro producto con ese código de barras.");

            _context.Entry(product).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Products.Any(p => p.Id == id))
                    return NotFound();
                else
                    throw;
            }

            return NoContent();
        }

        // DELETE: api/products/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound();

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}