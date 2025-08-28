using Microsoft.EntityFrameworkCore;
using Backend.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configurar la DB (usa la variable de entorno ConnectionStrings__DefaultConnection)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
);

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    // En producción también podemos habilitar Swagger opcionalmente:
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Inventory API v1");
        c.RoutePrefix = "swagger"; // Para acceder en /swagger
    });
}

app.UseHttpsRedirection();
app.UseAuthorization();

// Endpoint raíz de prueba
app.MapGet("/", () => "Inventory API is running 🚀");

// Mapear controllers
app.MapControllers();

app.Run();
