'use client'

import { createContext, type ReactNode, useContext } from 'react'

// Pratinjau Navbar di Admin → Navbar (revisi 2026-11-15): menu situs yang asli, namanya diganti
// isian yang bisa diketik. Di situs publik konteks ini kosong sehingga menu bekerja seperti biasa.
type NavLabelRenderer = (key: 'home' | 'about' | 'experience' | 'projects' | 'contact') => ReactNode

const NavEditContext = createContext<NavLabelRenderer | null>(null)

export function NavEditProvider({
  render,
  children,
}: {
  render: NavLabelRenderer
  children: ReactNode
}) {
  return <NavEditContext.Provider value={render}>{children}</NavEditContext.Provider>
}

export function useNavEdit() {
  return useContext(NavEditContext)
}
