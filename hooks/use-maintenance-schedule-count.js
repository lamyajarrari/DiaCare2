"use client"

import { useState, useEffect } from 'react'

export function useMaintenanceScheduleCount(status = 'Pending') {
  const [maintenanceCount, setMaintenanceCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMaintenanceCount = async () => {
      try {
        setLoading(true)
        
        // Construire l'URL de l'API avec le statut
        const apiUrl = `/api/maintenance?status=${status}`
        
        const response = await fetch(apiUrl)
        
        if (response.ok) {
          const maintenanceSchedules = await response.json()
          setMaintenanceCount(maintenanceSchedules.length)
        } else {
          console.error('Failed to fetch maintenance schedule count')
          setMaintenanceCount(0)
        }
      } catch (error) {
        console.error('Error fetching maintenance schedule count:', error)
        setMaintenanceCount(0)
      } finally {
        setLoading(false)
      }
    }

    // Récupérer le nombre de maintenance schedules immédiatement
    fetchMaintenanceCount()

    // Mettre à jour toutes les 30 secondes
    const interval = setInterval(fetchMaintenanceCount, 30000)

    return () => clearInterval(interval)
  }, [status])

  return { maintenanceCount, loading }
} 