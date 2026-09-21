// Sample data copied from the Lumière Word template. Replace each export with real data when a source exists.
export const auditSampleData = {
  utilization: { value: '78%', detail: '568 of 735 assets in use' },
  maintenance: { value: '91%', detail: '4 Overdue' },
  facilities: [
    ['Main Warehouse — Quezon City', 320, 210, 96, 14, '66%'],
    ['North Storage Annex', 180, 140, 30, 10, '22%'],
    ['South Logistics Hub', 145, 120, 20, 5, '17%'],
    ['Satellite Unit — Makati', 90, 70, 15, 5, '22%'],
  ] as const,
  bookings: [
    ['#EVT-014', 'Maria Santos', 'maria.santos@email.com', 'Corporate Gala', 'Grand Ballroom', 'Sep 10, 2026', 'APPROVED'],
    ['#EVT-013', 'John Cruz', 'john.cruz@email.com', 'Wedding Reception', 'Garden Pavilion', 'Sep 08, 2026', 'PENDING'],
    ['#EVT-012', 'Angela Reyes', 'angela.reyes@email.com', 'Product Launch', 'Conference Hall', 'Sep 05, 2026', 'WITHDRAWN'],
    ['#EVT-011', 'Marco Villanueva', 'marco.v@email.com', 'Debut Celebration', 'Grand Ballroom', 'Sep 03, 2026', 'PENDING'],
    ['#EVT-010', 'Katrina Lim', 'katrina.lim@email.com', 'Anniversary Dinner', 'Skyline Terrace', 'Sep 01, 2026', 'APPROVED'],
  ] as const,
  maintenanceLogs: [
    ['#MNT-08', 'Aurora Lighting Kit', 'Facilities Team', 'Quarterly Inspection', 'Oct 15, 2026', 'Pending', 'PENDING'],
    ['#MNT-07', 'Marlow Lounge Chair', 'Facilities Team', 'Quarterly Inspection', 'Sep 24, 2026', 'Pending', 'PENDING'],
    ['#MNT-06', 'Oak Plinth Set', 'Warehouse Crew', 'Quarterly Inspection', 'Sep 16, 2026', 'Pending', 'OVERDUE'],
    ['#MNT-05', 'Signature Drape Panel', 'Facilities Team', 'Quarterly Inspection', 'Oct 01, 2026', 'Pending', 'PENDING'],
    ['#MNT-04', 'Aurora Lighting Kit', 'Facilities Team', 'Annual Certification', 'Aug 31, 2026', '5/5 (Good)', 'COMPLETED'],
    ['#MNT-03', 'Oak Plinth Set', 'Warehouse Crew', 'Quarterly Inspection', 'Oct 01, 2026', '5/5 (Good)', 'COMPLETED'],
    ['#MNT-02', 'Marlow Lounge Chair', 'Facilities Team', 'Quarterly Inspection', 'Aug 11, 2026', '5/5 (Good)', 'COMPLETED'],
  ] as const,
} as const

export type AuditSampleData = typeof auditSampleData
