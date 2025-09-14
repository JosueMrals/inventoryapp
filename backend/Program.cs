using Backend.Data;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using Microsoft.AspNetCore.Localization;

var builder = WebApplication.CreateBuilder(args);

// CORS: añade aquí todos los orígenes del frontend que usarás
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins, policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "https://inventoryapp-mocha.vercel.app"
                // Agrega aquí otros dominios de frontend si los usas
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
            // .AllowCredentials(); // solo si usas cookies/sesión
    });
});

// Controllers y Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// IMPORTANTE: lee la cadena correctamente
// En Render, usa una env var llamada ConnectionStrings__DefaultConnection
// que mapea a "ConnectionStrings:DefaultConnection"
var connString = builder.Configuration.GetConnectionString("DefaultConnection");
// Valida para ver si llega
Console.WriteLine($"[DB] ConnectionString present: {(!string.IsNullOrWhiteSpace(connString))}");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connString));

// Opcional: si necesitas cultura invariante para decimales en [FromForm]
builder.Services.Configure<RequestLocalizationOptions>(opts =>
{
    var invariant = new RequestCulture(CultureInfo.InvariantCulture);
    opts.DefaultRequestCulture = invariant;
    opts.SupportedCultures = new[] { CultureInfo.InvariantCulture };
    opts.SupportedUICultures = new[] { CultureInfo.InvariantCulture };
});

var app = builder.Build();

// Swagger en dev
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Si estás detrás de proxy (Render), ayuda a respetar X-Forwarded-Proto
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

// Localización opcional (para decimales)
app.UseRequestLocalization();

// Sirve /wwwroot (necesario para /uploads/...)
app.UseStaticFiles();

// CORS antes de controllers
app.UseCors(MyAllowSpecificOrigins);

app.UseHttpsRedirection();

app.UseAuthorization();

// Aplica migraciones al iniciar (asegura que exista el schema)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        db.Database.Migrate();

        // Seed opcional para probar rápido
        if (!db.Products.Any())
        {
            db.Products.Add(new Backend.Models.Product
            {
                Name = "Producto de prueba",
                Price = 9.99M,
                Description = "Item inicial",
                Barcode = "TEST-001",
                ImageUrl = null
            });
            db.SaveChanges();
            Console.WriteLine("[DB] Seed inicial creado");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine("[DB] Error aplicando migraciones: " + ex.Message);
    }
}

app.MapControllers();

app.Run();
