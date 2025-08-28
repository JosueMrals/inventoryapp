using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;


namespace Backend.Endpoints;


public static class ItemsEndpoints
{
    public static IEndpointRouteBuilder MapItems(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/items");

        // List + búsqueda + paginado
        group.MapGet("", async (AppDbContext db, string? search, int page = 1, int pageSize = 20) =>
        {
            var query = db.Items.AsQueryable();
            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(i => i.Code.Contains(search) || (i.Description ?? "").Contains(search));
            }
            var total = await query.CountAsync();
            var data = await query
            .OrderByDescending(i => i.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
            return Results.Ok(new { total, data });
        });


        // Crear
        group.MapPost("", async (AppDbContext db, Item item) =>
        {
            item.CreatedAt = DateTime.UtcNow;
            item.UpdatedAt = DateTime.UtcNow;
            db.Items.Add(item);
            await db.SaveChangesAsync();
            return Results.Created($"/api/items/{item.Id}", item);
        });


        // Actualizar
        group.MapPut("{id:int}", async (int id, AppDbContext db, Item updated) =>
        {
            var item = await db.Items.FindAsync(id);
            if (item is null) return Results.NotFound();
            item.Code = updated.Code;
            item.Description = updated.Description;
            item.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
            return Results.Ok(item);
        });


        // Eliminar
        group.MapDelete("{id:int}", async (int id, AppDbContext db) =>
        {
            var item = await db.Items.FindAsync(id);
            if (item is null) return Results.NotFound();
            db.Items.Remove(item);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        return app;
    }
}