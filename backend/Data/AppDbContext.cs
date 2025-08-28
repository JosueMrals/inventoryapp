using Backend.Models;
using Microsoft.EntityFrameworkCore;


namespace Backend.Data;


public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Item> Items => Set<Item>();

    public DbSet<Product> Products { get; set; } = null!;


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Item>(e =>
        {
            e.HasIndex(x => x.Code).IsUnique(false);
        });
    }
}