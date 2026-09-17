using System;

namespace Lumiere.Core.Entities
{
    public class EventFinancials
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid EventId { get; set; }
        public decimal? EstimatedRevenue { get; set; }
        public decimal QuotationAmount { get; set; } = 0.00m;
        public decimal EstimatedAssetCost { get; set; } = 0.00m;
        public decimal TotalDamageCosts { get; set; } = 0.00m;
        public decimal TotalLaborCosts { get; set; } = 0.00m;
        public decimal TotalConsumableCosts { get; set; } = 0.00m;
        public decimal TotalEmergencyPurchases { get; set; } = 0.00m;
        public decimal EstimatedGrossMargin { get; set; }
        public bool IsLossMaker { get; set; } = false;
        public Guid? LossMakerAcknowledgedBy { get; set; }
        public DateTime? LossMakerAcknowledgedAt { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Event? Event { get; set; }
        public User? Acknowledger { get; set; }
    }
}
