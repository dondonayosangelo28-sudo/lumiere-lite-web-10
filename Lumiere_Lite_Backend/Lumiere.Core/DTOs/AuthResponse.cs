namespace Lumiere.Core.DTOs
{
    public class AuthResponse
    {
        public string Token { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public System.Guid UserId { get; set; }
        public string Role { get; set; } = string.Empty;
    }
}
