using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace Lumiere.Core.Interfaces
{
    public interface IAssetImportService
    {
        Task<List<Guid>> ImportAssetsPhase1Async(Stream csvStream, Guid currentUserId);
        Task ImportAssetsPhase2Async(List<Stream> imageStreams, List<Guid> assetIds, Guid currentUserId);
    }
}
