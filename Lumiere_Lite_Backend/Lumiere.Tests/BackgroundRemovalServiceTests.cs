using Lumiere.Application.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Xunit;

namespace Lumiere.Tests
{
    public class BackgroundRemovalServiceTests
    {
        [Fact]
        public async Task RemoveBackgroundAsync_UnconfiguredApiKey_SafelyReturnsOriginalStream()
        {
            // Arrange: Unconfigured API key
            var config = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>())
                .Build();

            var httpClient = new HttpClient();
            var service = new BackgroundRemovalService(httpClient, config, NullLogger<BackgroundRemovalService>.Instance);

            var sampleBytes = Encoding.UTF8.GetBytes("FakeImageDataStream");
            using var originalStream = new MemoryStream(sampleBytes);

            // Act
            var resultStream = await service.RemoveBackgroundAsync(originalStream);

            // Assert: Returned stream matches original bytes
            using var ms = new MemoryStream();
            await resultStream.CopyToAsync(ms);
            var resultBytes = ms.ToArray();

            Assert.Equal(sampleBytes, resultBytes);
        }
    }
}
