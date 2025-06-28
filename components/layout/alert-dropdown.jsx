"use client"

import { useState, useEffect } from 'react'
import { Bell, X, AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

export function AlertDropdown({ userRole }) {
  const [isOpen, setIsOpen] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      let apiUrl = '/api/alerts?status=active'
      
      if (userRole === 'technician') {
        apiUrl += '&role=technician'
      }
      
      const response = await fetch(apiUrl)
      if (response.ok) {
        const data = await response.json()
        setAlerts(data)
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchAlerts()
    }
  }, [isOpen, userRole])

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 border-red-200'
      case 'high':
        return 'bg-orange-100 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 border-yellow-200'
      default:
        return 'bg-blue-100 border-blue-200'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm" 
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {alerts.length > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white">
            {alerts.length}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Overlay pour fermer le dropdown */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Alertes ({alerts.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="max-h-96">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  Chargement des alertes...
                </div>
              ) : alerts.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Aucune alerte active
                </div>
              ) : (
                <div className="p-2">
                  {alerts.map((alert) => (
                    <Card 
                      key={alert.id} 
                      className={`mb-2 border-l-4 border-l-${getPriorityColor(alert.priority).split('-')[1]}-500 ${getPriorityColor(alert.priority)}`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start space-x-3">
                          {getPriorityIcon(alert.priority)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {alert.type}
                              </h4>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  alert.priority === 'critical' ? 'border-red-300 text-red-700' :
                                  alert.priority === 'high' ? 'border-orange-300 text-orange-700' :
                                  alert.priority === 'medium' ? 'border-yellow-300 text-yellow-700' :
                                  'border-blue-300 text-blue-700'
                                }`}
                              >
                                {alert.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {alert.message}
                            </p>
                            {alert.machine && (
                              <p className="text-xs text-gray-500 mb-1">
                                Machine: {alert.machine.name} ({alert.machine.inventoryNumber})
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              {formatDate(alert.timestamp)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>

            {alerts.length > 0 && (
              <div className="p-3 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    setIsOpen(false)
                    // Rediriger vers la page des alertes
                    window.location.href = `/dashboard/${userRole}/alerts`
                  }}
                >
                  Voir toutes les alertes
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
} 