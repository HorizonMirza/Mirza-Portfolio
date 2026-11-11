'use client'

import { createContext, type ReactNode, useCallback, useContext, useState } from 'react'

import { SIDEBAR_COOKIE } from './sidebar-cookie'

type SidebarState = { collapsed: boolean; toggle: () => void }

const Ctx = createContext<SidebarState>({ collapsed: false, toggle: () => {} })

// Status sidebar desktop bersama untuk tombol hamburger (top bar) dan sidebar. Pilihan disimpan di
// cookie satu tahun.
export function SidebarStateProvider({
  initialCollapsed,
  children,
}: {
  initialCollapsed: boolean
  children: ReactNode
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const toggle = useCallback(() => {
    const next = !collapsed
    setCollapsed(next)
    document.cookie = `${SIDEBAR_COOKIE}=${next ? 'collapsed' : 'open'}; path=/admin; max-age=31536000; samesite=lax`
  }, [collapsed])
  return <Ctx.Provider value={{ collapsed, toggle }}>{children}</Ctx.Provider>
}

export function useSidebarState() {
  return useContext(Ctx)
}
