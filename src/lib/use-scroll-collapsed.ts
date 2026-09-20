import { useEffect, useState } from 'react'

interface UseScrollCollapsedOptions {
  collapseAt?: number
  expandAt?: number
}

export function useScrollCollapsed({ collapseAt = 80, expandAt = 8 }: UseScrollCollapsedOptions = {}) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    let frame = 0

    const getPosition = () => {
      const shell = document.querySelector<HTMLElement>('.executive-mobile-shell')
      return Math.max(window.scrollY, shell?.scrollTop ?? 0)
    }

    const update = () => {
      frame = 0
      const position = getPosition()
      setCollapsed((current) => {
        if (!current && position > collapseAt) return true
        if (current && position < expandAt) return false
        return current
      })
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    const shell = document.querySelector<HTMLElement>('.executive-mobile-shell')
    shell?.addEventListener('scroll', onScroll, { passive: true })
    update()

    return () => {
      window.removeEventListener('scroll', onScroll)
      shell?.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [collapseAt, expandAt])

  return collapsed
}
