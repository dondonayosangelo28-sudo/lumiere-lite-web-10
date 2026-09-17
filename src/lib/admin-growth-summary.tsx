import { createContext, useContext, useMemo, type ReactNode } from 'react'

type GrowthSummaryContextValue = {
  openGrowthSummary: () => void
}

const GrowthSummaryContext = createContext<GrowthSummaryContextValue>({
  openGrowthSummary: () => undefined,
})

export function AdminGrowthSummaryProvider({ children }: { children: ReactNode }) {
  const value = useMemo<GrowthSummaryContextValue>(() => ({ openGrowthSummary: () => undefined }), [])
  return <GrowthSummaryContext.Provider value={value}>{children}</GrowthSummaryContext.Provider>
}

export function useGrowthSummary() {
  return useContext(GrowthSummaryContext)
}
