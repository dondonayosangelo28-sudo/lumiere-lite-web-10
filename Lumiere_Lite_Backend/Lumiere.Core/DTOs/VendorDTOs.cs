using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Lumiere.Core.DTOs
{
    public class CreateVendorRequest
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        public string? Address { get; set; }
    }

    public class AddRepresentativeRequest
    {
        [Required]
        public string FirstName { get; set; } = string.Empty;
        [Required]
        public string LastName { get; set; } = string.Empty;
    }

    public class AddContactRequest
    {
        [Required]
        public string PhoneNumber { get; set; } = string.Empty;
        public string? Type { get; set; }
    }

    public class AddPlatformRequest
    {
        [Required]
        public string PlatformName { get; set; } = string.Empty;
        [Required]
        public string Handle { get; set; } = string.Empty;
    }

    public class LinkVendorAssetRequest
    {
        [Required]
        public Guid VendorId { get; set; }
        [Required]
        [Range(0.01, 1000000000)]
        public decimal RentalPrice { get; set; }
    }

    public class VendorResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Address { get; set; }
        public List<RepresentativeDto> Representatives { get; set; } = new List<RepresentativeDto>();
    }

    public class RepresentativeDto
    {
        public Guid Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
    }
}
