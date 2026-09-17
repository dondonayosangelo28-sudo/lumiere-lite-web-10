using Lumiere.Core.DTOs;
using System.Threading.Tasks;

namespace Lumiere.Core.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponse> LoginAsync(LoginRequest request);
        Task LogoutAsync(string jti, System.DateTime expiresAt);
        Task<AuthResponse> RefreshAsync(string token); // Placeholder, typically handled differently
    }
}
