using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

// 🔹 Configuración de CORS
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
        policy =>
        {
            policy
                .WithOrigins(
                    "http://localhost:5173",
                    "https://inventoryapp-mocha.vercel.app"
                )
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
});

// 🔹 Agregar servicios
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 🔹 Configuración de base de datos (ejemplo con PostgreSQL en Render)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("ConnectionStrings__DefaultConnection"))
);

var app = builder.Build();

// 🔹 Middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 🔹 Habilitar CORS antes de MapControllers
app.UseCors(MyAllowSpecificOrigins);

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
