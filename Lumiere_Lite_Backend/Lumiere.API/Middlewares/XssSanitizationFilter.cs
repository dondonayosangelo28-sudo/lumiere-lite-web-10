using Ganss.Xss;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Linq;
using System.Reflection;

namespace Lumiere.API.Middlewares
{
    public class XssSanitizationFilter : IActionFilter
    {
        private readonly HtmlSanitizer _sanitizer;

        public XssSanitizationFilter()
        {
            _sanitizer = new HtmlSanitizer();
        }

        public void OnActionExecuting(ActionExecutingContext context)
        {
            foreach (var argument in context.ActionArguments.Values.Where(v => v != null))
            {
                SanitizeObject(argument);
            }
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
            // Do nothing
        }

        private void SanitizeObject(object? obj)
        {
            if (obj == null) return;

            var properties = obj.GetType().GetProperties(BindingFlags.Instance | BindingFlags.Public)
                                  .Where(p => p.PropertyType == typeof(string) && p.CanRead && p.CanWrite);

            foreach (var property in properties)
            {
                var value = property.GetValue(obj) as string;
                if (!string.IsNullOrEmpty(value))
                {
                    var sanitizedValue = _sanitizer.Sanitize(value);
                    if (value != sanitizedValue)
                    {
                        property.SetValue(obj, sanitizedValue);
                    }
                }
            }
        }
    }
}
