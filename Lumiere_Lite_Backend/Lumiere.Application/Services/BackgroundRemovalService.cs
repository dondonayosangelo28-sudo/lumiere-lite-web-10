using Lumiere.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace Lumiere.Application.Services
{
    public class BackgroundRemovalService : IBackgroundRemovalService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<BackgroundRemovalService> _logger;

        public BackgroundRemovalService(HttpClient httpClient, IConfiguration configuration, ILogger<BackgroundRemovalService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<Stream> RemoveBackgroundAsync(Stream imageStream)
        {
            if (imageStream == null || imageStream.Length == 0)
            {
                return imageStream ?? new MemoryStream();
            }

            // Copy input stream to memory so it can be re-read if fallback is needed
            var originalMemoryStream = new MemoryStream();
            if (imageStream.CanSeek)
            {
                imageStream.Position = 0;
            }
            await imageStream.CopyToAsync(originalMemoryStream);
            originalMemoryStream.Position = 0;

            var apiKey = _configuration["BackgroundRemoval:ApiKey"] ?? _configuration["BackgroundRemoval__ApiKey"];
            var endpoint = _configuration["BackgroundRemoval:Endpoint"] ?? _configuration["BackgroundRemoval__Endpoint"] ?? "https://api.remove.bg/v1.0/removebg";

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                _logger.LogWarning("BackgroundRemoval:ApiKey is missing. Returning original image stream without background removal.");
                return originalMemoryStream;
            }

            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
                using var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
                request.Headers.Add("X-Api-Key", apiKey);

                using var content = new MultipartFormDataContent();
                var imageContent = new ByteArrayContent(originalMemoryStream.ToArray());
                imageContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/jpeg");
                content.Add(imageContent, "image_file", "catalog.jpg");
                content.Add(new StringContent("auto"), "size");

                request.Content = content;

                var response = await _httpClient.SendAsync(request, cts.Token);

                if (response.IsSuccessStatusCode)
                {
                    var cutoutStream = new MemoryStream();
                    await response.Content.CopyToAsync(cutoutStream);
                    cutoutStream.Position = 0;
                    _logger.LogInformation("Background removal via Remove.bg succeeded.");
                    return cutoutStream;
                }
                else
                {
                    _logger.LogWarning("Remove.bg API call failed with status code {StatusCode}. Falling back to original image stream.", response.StatusCode);
                    originalMemoryStream.Position = 0;
                    return originalMemoryStream;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Exception encountered during Remove.bg background removal API call. Falling back to original image stream.");
                originalMemoryStream.Position = 0;
                return originalMemoryStream;
            }
        }
    }
}
