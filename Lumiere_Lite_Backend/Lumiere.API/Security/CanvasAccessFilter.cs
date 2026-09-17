using Lumiere.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Lumiere.API.Security
{
    public class RequireCanvasAccessAttribute : TypeFilterAttribute
    {
        public RequireCanvasAccessAttribute(string requiredLevel) : base(typeof(CanvasAccessFilter))
        {
            Arguments = new object[] { requiredLevel };
        }
    }

    public class CanvasAccessFilter : IAsyncActionFilter
    {
        private readonly string _requiredLevel;

        public CanvasAccessFilter(string requiredLevel)
        {
            _requiredLevel = requiredLevel;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var httpContext = context.HttpContext;
            var user = httpContext.User;

            if (!user.Identity?.IsAuthenticated ?? true)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            var roleName = user.FindFirst("role_name")?.Value;
            
            // Bypass filter if the user's permanent role allows canvas control
            if (roleName == "SystemAdmin" || roleName == "Supervisor" || roleName == "FrontOfficePlanner")
            {
                await next();
                return;
            }

            // Extract EventId from action arguments or route parameters
            Guid? eventId = null;

            // 1. Try route parameter "eventId"
            if (context.RouteData.Values.TryGetValue("eventId", out var eventIdVal) && 
                Guid.TryParse(eventIdVal?.ToString(), out var parsedRouteEventId))
            {
                eventId = parsedRouteEventId;
            }
            // 2. Try route parameter "reservationId" (load event from reservation table)
            else if (context.RouteData.Values.TryGetValue("reservationId", out var resIdVal) && 
                     Guid.TryParse(resIdVal?.ToString(), out var reservationId))
            {
                var dbContext = httpContext.RequestServices.GetService(typeof(AppDbContext)) as AppDbContext;
                if (dbContext != null)
                {
                    var reservation = await dbContext.AssetReservations
                        .AsNoTracking()
                        .FirstOrDefaultAsync(r => r.Id == reservationId);
                    if (reservation != null)
                    {
                        eventId = reservation.EventId;
                    }
                }
            }
            // 3. Try action arguments/request body
            else
            {
                var requestModel = context.ActionArguments.Values.FirstOrDefault(arg => arg != null);
                if (requestModel != null)
                {
                    var prop = requestModel.GetType().GetProperty("EventId");
                    if (prop != null && prop.PropertyType == typeof(Guid))
                    {
                        eventId = (Guid)prop.GetValue(requestModel)!;
                    }
                }
            }

            if (eventId == null)
            {
                context.Result = new BadRequestObjectResult(new { Error = "Event context could not be determined for canvas access validation." });
                return;
            }

            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                context.Result = new ForbidResult();
                return;
            }

            var db = httpContext.RequestServices.GetService(typeof(AppDbContext)) as AppDbContext;
            if (db == null)
            {
                context.Result = new StatusCodeResult(500);
                return;
            }

            // Query event_viewers for active grant
            var activeGrant = await db.EventViewers
                .AsNoTracking()
                .FirstOrDefaultAsync(ev => ev.EventId == eventId.Value && ev.UserId == userId && ev.RevokedAt == null);

            if (activeGrant == null)
            {
                context.Result = new ForbidResult();
                return;
            }

            // Validate access level hierarchy
            // CO_EDIT requires CO_EDIT
            if (_requiredLevel == "CO_EDIT" && activeGrant.AccessLevel != "CO_EDIT")
            {
                context.Result = new ForbidResult();
                return;
            }

            // COMMENT requires COMMENT or CO_EDIT
            if (_requiredLevel == "COMMENT" && activeGrant.AccessLevel != "COMMENT" && activeGrant.AccessLevel != "CO_EDIT")
            {
                context.Result = new ForbidResult();
                return;
            }

            // VIEW is satisfied by any active grant (since VIEW is the lowest tier)
            await next();
        }
    }
}
