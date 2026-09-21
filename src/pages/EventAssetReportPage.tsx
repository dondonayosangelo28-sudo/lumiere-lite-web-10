import { ArrowDown, QrCode } from 'lucide-react'
import type { ReactNode } from 'react'

const assets = [
  ['Aurora Lighting Kit', 'Lighting', 6, 6, 6, 0, 0, 'COMPLETE'],
  ['Marlow Lounge Chair', 'Furniture', 8, 8, 8, 1, 0, 'REVIEW'],
  ['Oak Plinth Set', 'Display', 16, 16, 15, 1, 0, 'DEFICIT'],
  ['Signature Drape Panel', 'Décor', 12, 12, 12, 0, 0, 'COMPLETE'],
] as const
const timeline = [
  ['DISPATCH', 'September 20, 2026 — 8:00 AM', 'Warehouse → Loading'],
  ['TRANSIT', 'September 20, 2026 — 9:15 AM', 'In Transit'],
  ['INGRESS', 'September 20, 2026 — 10:10 AM', 'Arrived at Venue'],
  ['SETUP', 'September 20, 2026 — 11:00 AM', 'Setup Completed'],
  ['EVENT', 'September 20, 2026 — 6:00 PM', 'Event Started'],
  ['EGRESS', 'September 21, 2026 — 12:15 AM', 'Post-Event Inspection'],
  ['RETURN', 'September 21, 2026 — 2:00 AM', 'Assets Returned'],
] as const

const LabelValue = ({ label, value }: { label: string; value: string }) => (
  <div className="border-b border-[#d9cbae] px-3 py-2.5">
    <div className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">{label}</div>
    <div className="mt-1 text-[12px] font-semibold text-slate-900">{value}</div>
  </div>
)
const Section = ({ number, title, children }: { number: string; title: string; children: ReactNode }) => (
  <section className="report-section break-inside-avoid">
    <h2 className="flex items-baseline gap-2 border-b border-[#d9cbae] pb-1 text-[13px] font-bold uppercase tracking-[.12em] text-slate-900"><span className="text-[#8b6f47]">{number}</span>{title}</h2>
    <div className="mt-3">{children}</div>
  </section>
)

export function EventAssetReportPage() {
  return (
    <main className="min-h-screen bg-[#ece8e1] px-4 py-8 text-slate-900 print:bg-white print:p-0">
      <article className="mx-auto max-w-[210mm] bg-white p-[12mm] shadow-[0_12px_45px_rgba(42,33,26,.12)] print:max-w-none print:shadow-none">
        <header className="text-center">
          <div className="text-4xl font-extrabold tracking-[.18em] text-[#8b6f47]">LUMIÈRE</div>
          <div className="mt-1 text-[12px] font-bold uppercase tracking-[.2em] text-slate-500">EVENT ASSET &amp; LOGISTICS REPORT</div>
          <div className="mt-5 grid grid-cols-3 overflow-hidden rounded border border-[#d9cbae] bg-[#f7f0e6] text-left">
            <LabelValue label="Event Reference" value="EVT-2026-00072" />
            <LabelValue label="Generated" value="September 18, 2026" />
            <LabelValue label="Status" value="COMPLETED" />
          </div>
        </header>

        <div className="mt-7 space-y-7">
          <Section number="1." title="Event Information">
            <div className="grid grid-cols-4 border-l border-t border-[#d9cbae]"><LabelValue label="Event Name" value="Annual Corporate Gala 2026" /><LabelValue label="Client" value="ABC Corporation" /><LabelValue label="Venue" value="Grand Ballroom" /><LabelValue label="Event Type" value="Corporate" /><LabelValue label="Event Date" value="September 20, 2026" /><LabelValue label="Event Time" value="6:00 PM – 11:00 PM" /><LabelValue label="Expected Guests" value="250" /><LabelValue label="Event Status" value="Completed" /><LabelValue label="Event Coordinator" value="[Coordinator Name]" /><LabelValue label="Venue Contact" value="[Contact Name]" /><LabelValue label="Created" value="August 4, 2026" /><LabelValue label="Last Updated" value="September 21, 2026" /></div>
          </Section>

          <Section number="2." title="Event Overview">
            <p className="max-w-[170mm] text-[12px] italic leading-5 text-slate-700">A corporate appreciation event featuring stage styling, guest tables, decorative displays, lighting elements, and customized event installations.</p>
          </Section>

          <Section number="3." title="Asset Summary">
            <div className="grid grid-cols-6 rounded border border-[#d9cbae] bg-[#f7f0e6] p-3 text-center">{[['42','PLANNED'],['42','DEPLOYED'],['40','RETURNED'],['1','DAMAGED'],['1','MISSING / LOST'],['0','PENDING']].map(([value,label]) => <div key={label} className="border-r border-[#d9cbae] last:border-0"><div className="font-serif text-2xl font-bold text-slate-900">{value}</div><div className="mt-1 text-[9px] font-bold tracking-wider text-slate-500">{label}</div></div>)}</div>
          </Section>

          <Section number="4." title="Assets Deployed">
            <div className="overflow-hidden border border-[#d9cbae]"><table className="w-full border-collapse text-[10px]"><thead className="bg-[#8b6f47] text-left text-[9px] font-bold uppercase tracking-wider text-white"><tr>{['Asset','Class','Planned','Deployed','Returned','Damaged','Lost','Status'].map(h => <th key={h} className="px-2 py-2">{h}</th>)}</tr></thead><tbody>{assets.map(row => <tr key={row[0]} className="border-t border-[#d9cbae]"><td className="px-2 py-2 font-semibold">{row[0]}</td><td className="px-2 py-2">{row[1]}</td>{row.slice(2,7).map((v, i) => <td key={i} className="px-2 py-2 text-center">{v}</td>)}<td className="px-2 py-2 text-center font-bold"><span className={row[7] === 'COMPLETE' ? 'text-[#3f6b44]' : row[7] === 'REVIEW' ? 'text-[#9a6b12]' : 'text-[#9a3324]'}>{row[7]}</span></td></tr>)}</tbody></table></div>
          </Section>

          <Section number="5." title="Logistics Information">
            <div className="rounded border border-[#d9cbae] p-4">{timeline.map(([step, date, detail], i) => <div key={step} className="flex flex-col items-center text-center">{i > 0 && <ArrowDown className="my-1 h-4 w-4 text-[#8b6f47]" /> }<div className="text-[11px] font-bold tracking-wider text-[#8b6f47]">{step}</div><div className="text-[11px] font-semibold">{date}</div><div className="text-[11px] italic text-slate-500">{detail}</div></div>)}</div>
            <div className="mt-4 grid grid-cols-3 border-l border-t border-[#d9cbae]"><LabelValue label="Vehicle" value="Truck 02" /><LabelValue label="Driver" value="-" /><LabelValue label="Dispatch" value="Sept 20, 2026 — 8:00 AM" /><LabelValue label="Venue Arrival" value="Sept 20, 2026 — 10:10 AM" /><LabelValue label="Return" value="Sept 21, 2026 — 2:00 AM" /><LabelValue label="Crew" value="-" /></div>
          </Section>

          <Section number="6." title="Ingress"><div className="grid grid-cols-4 border-l border-t border-[#d9cbae]"><LabelValue label="Dispatch Loading Status" value="Confirmed" /><LabelValue label="Items Dispatched" value="42" /><LabelValue label="Items Received" value="42" /><LabelValue label="Venue Arrival" value="10:10 AM" /><LabelValue label="Receiving Status" value="Confirmed" /><LabelValue label="Setup Handoff" value="10:20 AM" /><LabelValue label="Exceptions" value="None" /></div></Section>
          <Section number="7." title="On-Site / Setup"><div className="grid grid-cols-4 border-l border-t border-[#d9cbae]"><LabelValue label="Setup Start" value="10:20 AM" /><LabelValue label="Setup Completion" value="11:00 AM" /><LabelValue label="Crew" value="[Names]" /><LabelValue label="Assets Staged" value="42 / 42" /><LabelValue label="Exceptions" value="None" /><LabelValue label="On-Site Status" value="Completed" /></div></Section>
          <Section number="8." title="Egress & Return"><div className="grid grid-cols-4 border-l border-t border-[#d9cbae]"><LabelValue label="Post-Event Inspection" value="Completed" /><LabelValue label="Expected Return Qty" value="42" /><LabelValue label="Actual Return Qty" value="40" /><LabelValue label="Damaged" value="1" /><LabelValue label="Missing / Lost" value="1" /><LabelValue label="Egress Timestamp" value="Sept 21, 2026 — 12:15 AM" /><LabelValue label="Return Timestamp" value="Sept 21, 2026 — 2:00 AM" /><LabelValue label="Return Status" value="Requires Review" /></div></Section>
          <Section number="9." title="Asset Reconciliation"><div className="grid grid-cols-[1fr_120px] border border-[#d9cbae] text-[11px]">{[['METRIC','QUANTITY'],['Planned','42'],['Deployed','42'],['Returned','40'],['Damaged','1'],['Lost / Missing','1'],['Pending','0']].map(([a,b]) => <><div className="border-b border-[#d9cbae] px-3 py-2 font-semibold last:border-0">{a}</div><div className="border-b border-[#d9cbae] px-3 py-2 text-center font-bold last:border-0">{b}</div></>)}</div></Section>
          <Section number="10." title="Deficit / Exceptions"><div className="grid grid-cols-4 border-l border-t border-[#d9cbae]"><LabelValue label="Asset" value="Oak Plinth Set" /><LabelValue label="Expected" value="16" /><LabelValue label="Returned" value="15" /><LabelValue label="Deficit" value="1" /></div><p className="mt-3 text-[11px] font-bold">STATUS <span className="text-[#9a3324]">Investigation Required</span></p></Section>
          <Section number="11." title="Crew & Responsibility"><div className="grid grid-cols-4 border-l border-t border-[#d9cbae]">{['Event Coordinator','Crew Lead','Dispatch Crew','Setup Crew','Egress Crew','Driver','Venue Contact','Vehicle'].map((label, i) => <LabelValue key={label} label={label} value={i === 7 ? 'Truck 02' : '-'} />)}</div></Section>
          <Section number="12." title="Audit & Verification"><div className="grid grid-cols-2 border-l border-t border-[#d9cbae]"><LabelValue label="Event Reference ID" value="EVT-2026-00072" /><LabelValue label="Report Reference" value="RPT-2026-00072" /><LabelValue label="Generated By" value="System (Lumière)" /><LabelValue label="Generated Timestamp" value="September 18, 2026 — 09:42 AM" /><LabelValue label="Last Synchronization" value="September 21, 2026 — 2:05 AM" /><LabelValue label="Last Modified" value="September 21, 2026 — 2:05 AM" /><LabelValue label="Verified By" value="[Verifier Name]" /><LabelValue label="Verification Status" value="Verified" /></div><div className="mt-4 flex items-center gap-4"><div className="grid h-16 w-16 place-items-center border border-[#d9cbae]"><QrCode className="h-10 w-10 text-slate-700" /></div><div><div className="text-[11px] font-bold uppercase tracking-wider">Scan to verify event record</div><div className="text-[11px] italic text-slate-500">Ref: EVT-2026-00072</div></div></div><p className="mt-5 text-center text-[11px] italic leading-5 text-slate-600">This report is a system-generated record of the Lumière event asset lifecycle and is provided for internal operations, accountability, and archival purposes.</p></Section>
        </div>
        <footer className="mt-8 flex items-center justify-between border-t border-[#d9cbae] pt-3 text-[10px] text-slate-500"><span>LUMIÈRE · Event Asset &amp; Logistics Report · Event Reference: EVT-2026-00072</span><span>PAGE 1 / 1</span></footer>
      </article>
    </main>
  )
}
export default EventAssetReportPage
