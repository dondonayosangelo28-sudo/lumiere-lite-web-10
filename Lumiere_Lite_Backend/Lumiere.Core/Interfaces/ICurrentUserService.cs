using System;

namespace Lumiere.Core.Interfaces
{
    public interface ICurrentUserService
    {
        Guid? UserId { get; }
        string? Email { get; }
    }
}
