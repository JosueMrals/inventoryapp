using Backend.Data;
using Backend.Endpoints;
using Microsoft.EntityFrameworkCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Serilog Console
Log.Logger = new LoggerConfiguration()
.WriteTo.Console()
.CreateLogger();
builder.Host.UseSerilog();


// Config DB
var provider = builder.Configuration["Database:Provider"] ?? "Postgres";
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// Swagger (solo Dev)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS
var allowed = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["*"];
builder.Services.AddCors(o =>
{
    o.AddPolicy("CorsPolicy", b => b.WithOrigins(allowed)
    .AllowAnyHeader()
    .AllowAnyMethod());
});

// Health Checks
builder.Services.AddHealthChecks();

var app = builder.Build();

app.UseCors("CorsPolicy");
app.MapHealthChecks("/health");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Auto-crear DB (prototipo). Para prod, usa Migraciones.
using (var scope = app.Services.CreateScope())
{
var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
if (provider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase))
    db.Database.EnsureCreated();
else
    db.Database.Migrate(); // asume migraciones compiladas si las generas
}

app.MapGet("/health", () => Results.Ok("OK"));
app.MapItems();

app.Run();