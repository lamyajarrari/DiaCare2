// Votre_Chemin/components/Navbar.jsx (ou .tsx)
"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Bell, LogOut, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAlertsCount } from "@/hooks/use-alerts-count"
import { useTranslation } from "@/lib/translations"

export function Navbar({ userRole, userName }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const { alertsCount, loading, error } = useAlertsCount(userRole)
  const { t } = useTranslation()

  const handleLogout = () => {
    router.push("/login")
  }

  const getNavLinks = () => {
    switch (userRole) {
      case "patient":
        return [
          { href: "/dashboard/patient", label: t('navigation.dashboard') },
          { href: "/dashboard/patient/faults", label: t('navigation.faultHistory') },
        ]
      case "technician":
        return [
          { href: "/dashboard/technician", label: t('navigation.dashboard') },
          { href: "/dashboard/technician/alerts", label: t('navigation.alerts') },
          { href: "/dashboard/technician/interventions", label: t('navigation.interventions') },
          { href: "/dashboard/technician/maintenance", label: t('navigation.maintenance') },
        ]
      case "admin":
        return [
          { href: "/dashboard/admin", label: t('navigation.dashboard') },
          { href: "/dashboard/admin/users", label: t('navigation.users') },
          { href: "/dashboard/admin/machines", label: t('navigation.machines') },
          { href: "/dashboard/admin/reports", label: t('navigation.reports') },
          { href: "/dashboard/admin/taxe", label: t('navigation.taxe') },
        ]
      default:
        return []
    }
  }

  // Déterminer l'URL des alertes selon le rôle
  const getAlertsUrl = () => {
    switch (userRole) {
      case "technician":
        return "/dashboard/technician/alerts"
      case "admin":
        return "/dashboard/admin/alerts"
      default:
        return "/dashboard/technician/alerts"
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/dashboard/${userRole}`} className="flex items-center space-x-2">
            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="DiaCare Logo"
                width={64}
                height={64}
                className="object-contain"
              />
            </div>
          </Link>

          <div className="hidden md:flex space-x-6">
            {getNavLinks().map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Lien vers les alertes avec badge, seulement pour le technicien */}
          {userRole === 'technician' && (
            <Link href={getAlertsUrl()}>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                {alertsCount > 0 && !error && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white">
                    {loading ? "..." : alertsCount}
                  </Badge>
                )}
                {error && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-yellow-500 text-white">
                    !
                  </Badge>
                )}
              </Button>
            </Link>
          )}
          <div className="hidden md:flex items-center space-x-2">
            <span className="text-sm text-gray-600">{t('navigation.welcome')}, {userName}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
          <div className="flex flex-col space-y-2">
            {getNavLinks().map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-600 hover:text-gray-900 font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-gray-200 pt-2 mt-2">
              <span className="text-sm text-gray-600 block py-1">{t('navigation.welcome')}, {userName}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="justify-start p-0">
                <LogOut className="h-4 w-4 mr-2" />
                {t('navigation.logout')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}