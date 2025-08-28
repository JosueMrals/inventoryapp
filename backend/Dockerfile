# Etapa de build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiamos csproj y restauramos dependencias
COPY *.sln .
COPY backend/*.csproj ./backend/
RUN dotnet restore backend/*.csproj

# Copiamos todo el código y publicamos
COPY backend/. ./backend/
WORKDIR /src/backend
RUN dotnet publish -c Release -o /app/out

# Etapa de runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/out .
ENTRYPOINT ["dotnet", "Backend.dll"]
