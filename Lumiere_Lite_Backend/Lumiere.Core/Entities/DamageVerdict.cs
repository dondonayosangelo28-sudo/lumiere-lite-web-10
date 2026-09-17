namespace Lumiere.Core.Entities
{
    public static class DamageVerdict
    {
        public const string PendingVerdict = "Pending Verdict";
        public const string Validated = "Validated";
        public const string Dismissed = "Dismissed";
        public const string HeldForAudit = "Held for Audit";
        public const string PendingSecondSignOff = "Pending Second Sign-off";
        public const string Repair = "Repair";
        public const string WriteOff = "Write-off";

        public static readonly string[] NonBlockingSettlementVerdicts = new[]
        {
            Validated, Dismissed, Repair, WriteOff
        };

        public static readonly string[] BlockingSettlementVerdicts = new[]
        {
            PendingVerdict, HeldForAudit, PendingSecondSignOff
        };
    }
}
