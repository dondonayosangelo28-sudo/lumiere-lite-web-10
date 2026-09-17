using Lumiere.Core.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Lumiere.Core.Interfaces
{
    public interface IEphemeralPermissionService
    {
        Task<Guid> GrantPermissionAsync(GrantEphemeralPermissionRequest request, Guid currentUserId);
        Task RevokePermissionAsync(Guid permId, Guid currentUserId);
        Task<IEnumerable<object>> GetActivePermissionsAsync();
    }
}
