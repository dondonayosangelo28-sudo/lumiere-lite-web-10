using Lumiere.API.Middlewares;
using Lumiere.API.Security;
using Lumiere.API.Services;
using Lumiere.Application.Services;
using Lumiere.Core.Interfaces;
using Lumiere.Infrastructure.Data;
using Lumiere.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Supabase;
using System;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Configure dynamic port binding for Railway container environments
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container.
// Register XSS Sanitization Filter globally
builder.Services.AddControllers(options => 
{
    options.Filters.Add<XssSanitizationFilter>();
}).AddJsonOptions(options => 
{
    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
}).AddApplicationPart(typeof(Lumiere.API.Controllers.AuthController).Assembly);

// Configure CORS for React frontend
var defaultOrigins = new[]
{
    "http://localhost:5173",
    "http://localhost:3000",
    "https://lumieredemo-seven.vercel.app",
    "https://lumiere-lite.vercel.app"
};
var envOrigins = builder.Configuration["Cors:AllowedOrigins"] ?? builder.Configuration["CORS_ALLOWED_ORIGINS"];
var allowedOrigins = string.IsNullOrWhiteSpace(envOrigins)
    ? defaultOrigins
    : defaultOrigins.Concat(envOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)).Distinct().ToArray();

builder.Services.AddCors(options =>
{
    options.AddPolicy("VercelProductionPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configure Supabase Client
var supabaseUrl = builder.Configuration["Supabase:Url"] 
               ?? builder.Configuration["Supabase__Url"]
               ?? builder.Configuration["SUPABASE_URL"]
               ?? "https://placeholder.supabase.co";
var supabaseKey = builder.Configuration["Supabase:AnonKey"] 
               ?? builder.Configuration["Supabase__AnonKey"]
               ?? builder.Configuration["SUPABASE_ANON_KEY"]
               ?? "placeholder-anon-key";
var supabaseOptions = new SupabaseOptions
{
    AutoRefreshToken = false,
    AutoConnectRealtime = false
};
builder.Services.AddSingleton(provider => new Client(supabaseUrl, supabaseKey, supabaseOptions));

// Configure Database Context
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrEmpty(connectionString))
{
    connectionString = builder.Configuration["DATABASE_URL"] 
                    ?? builder.Configuration["DATABASE_PRIVATE_URL"]
                    ?? builder.Configuration["ConnectionStrings:DefaultConnection"];
}

bool isProduction = builder.Environment.IsProduction();
bool hasConnectionString = !string.IsNullOrEmpty(connectionString);

if (hasConnectionString)
{
    Log.Information("Configuring PostgreSQL database connection.");
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(connectionString, o => o.CommandTimeout(120)));
}
else if (isProduction)
{
    Log.Fatal("No PostgreSQL connection string found in Production environment (ConnectionStrings:DefaultConnection or DATABASE_URL). Terminating process.");
    throw new InvalidOperationException("Production database connection string is missing. Silent InMemory fallback is disabled in Production.");
}
else
{
    Log.Warning("No PostgreSQL connection string provided. Falling back to InMemory database for local Development execution.");
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseInMemoryDatabase("LumiereDb"));
}

// Add Memory Cache for tokens and lockouts
builder.Services.AddMemoryCache();

// Register HttpClient
builder.Services.AddHttpClient();

// Register application services
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEphemeralPermissionService, EphemeralPermissionService>();
builder.Services.AddScoped<IEventService, EventService>();
builder.Services.AddScoped<IAssetService, AssetService>();
builder.Services.AddScoped<IVendorService, VendorService>();
builder.Services.AddScoped<IDeficitQueueService, DeficitQueueService>();
builder.Services.AddScoped<IBackgroundRemovalService, BackgroundRemovalService>();
builder.Services.AddScoped<IAssetImportService, AssetImportService>();
builder.Services.AddScoped<IReservationService, ReservationService>();
builder.Services.AddScoped<IDispatchService, DispatchService>();
builder.Services.AddScoped<IDamageReportService, DamageReportService>();
builder.Services.AddScoped<ICanvasService, CanvasService>();
builder.Services.AddScoped<IManningService, ManningService>();
builder.Services.AddScoped<IProductionService, ProductionService>();
builder.Services.AddScoped<IOfflineSyncService, OfflineSyncService>();
builder.Services.AddScoped<Microsoft.AspNetCore.Authentication.IClaimsTransformation, Lumiere.API.Security.EphemeralClaimsTransformation>();
builder.Services.AddHostedService<Lumiere.Application.Workers.LostInActionAuditWorker>();
builder.Services.AddHostedService<Lumiere.Application.Workers.EphemeralExpiryAuditWorker>();

// Configure JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret ?? throw new InvalidOperationException("JWT Secret is missing")))
        };
    });

// Register Custom RBAC Handlers
builder.Services.AddSingleton<IAuthorizationPolicyProvider, RbacPolicyProvider>();
builder.Services.AddSingleton<IAuthorizationHandler, RbacAuthorizationHandler>();

// Configure Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { Error = "An unexpected error occurred." });
    });
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseSerilogRequestLogging();

// Enforce HTTPS
if (!app.Environment.IsProduction())
{
    app.UseHttpsRedirection();
}
app.UseHsts();

app.UseCors("VercelProductionPolicy");

app.UseAuthentication();

// Add Token Blacklist Middleware (must be after Auth, before AuthZ)
app.UseMiddleware<TokenBlacklistMiddleware>();

// Add Ephemeral Permission Middleware
app.UseMiddleware<EphemeralPermissionMiddleware>();

app.UseAuthorization();

app.MapControllers();

// Diagnostic: Dump all registered endpoints on startup to console logs once the application host has fully started
app.Lifetime.ApplicationStarted.Register(() =>
{
    var dataSources = app.Services.GetServices<EndpointDataSource>();
    foreach (var dataSource in dataSources)
    {
        foreach (var endpoint in dataSource.Endpoints)
        {
            var routePattern = (endpoint as RouteEndpoint)?.RoutePattern?.RawText;
            Log.Information("Mapped Route: {Route} | Name: {Name}", routePattern ?? endpoint.DisplayName, endpoint.DisplayName);
        }
    }
});

// Seed Database Schema and Initial Roles & Test Users
try
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbInitializer.SeedAsync(dbContext, app.Environment.IsProduction());
    Log.Information("Database initialization and seeding completed.");
}
catch (Exception ex)
{
    Log.Error(ex, "An error occurred during database initialization/seeding: {Message}", ex.Message);
}

app.Run();

public partial class Program { }
