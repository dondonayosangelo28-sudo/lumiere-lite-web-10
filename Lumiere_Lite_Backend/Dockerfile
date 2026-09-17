FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

COPY *.sln* ./
COPY Lumiere.API/*.csproj ./Lumiere.API/
COPY Lumiere.Application/*.csproj ./Lumiere.Application/
COPY Lumiere.Core/*.csproj ./Lumiere.Core/
COPY Lumiere.Infrastructure/*.csproj ./Lumiere.Infrastructure/
COPY Lumiere.Tests/*.csproj ./Lumiere.Tests/

RUN dotnet restore

COPY . .

RUN dotnet publish Lumiere.API/Lumiere.API.csproj -c Release -o out

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgssapi-krb5-2 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/out .
ENTRYPOINT ["dotnet", "Lumiere.API.dll"]
