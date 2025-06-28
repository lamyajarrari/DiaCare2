"use client"

import { useState, useEffect } from 'react'

export function useAlertsCount(userRole) {
  const [alertsCount, setAlertsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchAlertsCount = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Construire l'URL de l'API selon le rôle
        let apiUrl = '/api/alerts?status=active'
        
        // Si c'est un technicien, on peut filtrer par rôle si nécessaire
        if (userRole === 'technician') {
          apiUrl += '&role=technician'
        }
        
        console.log('Fetching alerts count from:', apiUrl)
        
        const response = await fetch(apiUrl)
        
        if (response.ok) {
          const alerts = await response.json()
          console.log('Alerts count response:', alerts.length, 'alerts')
          setAlertsCount(alerts.length)
        } else {
          const errorText = await response.text()
          console.error('Failed to fetch alerts count:', response.status, errorText)
          setError(`HTTP ${response.status}: ${errorText}`)
          setAlertsCount(0)
        }
      } catch (error) {
        console.error('Error fetching alerts count:', error)
        setError(error.message)
        setAlertsCount(0)
      } finally {
        setLoading(false)
      }
    }

    // Récupérer le nombre d'alertes immédiatement
    fetchAlertsCount()

    // Mettre à jour toutes les 30 secondes
    const interval = setInterval(fetchAlertsCount, 30000)

    return () => clearInterval(interval)
  }, [userRole])

  return { alertsCount, loading, error }
} 