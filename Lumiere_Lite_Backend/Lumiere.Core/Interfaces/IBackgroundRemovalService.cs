using System.IO;
using System.Threading.Tasks;

namespace Lumiere.Core.Interfaces
{
    public interface IBackgroundRemovalService
    {
        Task<Stream> RemoveBackgroundAsync(Stream imageStream);
    }
}
