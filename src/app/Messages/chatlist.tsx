'use client'
import React, { useEffect, useState } from 'react'
import { db } from '../firebaseConfig'
import { equalTo, onValue, orderByChild, query, ref } from 'firebase/database'
import { useRouter } from 'next/navigation'

interface Incident {
    id: string
    locationName: string
    lastMessage: string
    timestamp: number
}

function Chatlist({ onIncidentClick }: { onIncidentClick: (id: string) => void }) {
    const [incidents, setIncidents] = useState<Incident[]>([])
    const router = useRouter()

    useEffect(() => {
        const incidentsRef = ref(db, 'incidents')
        const pendingIncidentsRef = query(incidentsRef, orderByChild('status'), equalTo('pending'))

        const handleIncidentData = (snapshot: any) => {
            if (snapshot.exists()) {
                let incidentList: Incident[] = []

                snapshot.forEach((incidentSnapshot: any) => {
                    const incident = incidentSnapshot.val()
                    const incidentKey = incidentSnapshot.key
                    const messages = incident.messages || {}

                    let lastMessage = ''
                    let timestamp = 0

                    Object.values(messages).forEach((message: any) => {
                        if (message.timestamp > timestamp) {
                            lastMessage = message.text
                            timestamp = message.timestamp
                        }
                    })

                    incidentList.push({
                        id: incidentKey,
                        locationName: incident.locationName,
                        lastMessage,
                        timestamp
                    })
                })

                setIncidents(incidentList.sort((a, b) => b.timestamp - a.timestamp))
            } else {
                console.log('No data available')
            }
        }

        const unsubscribe = onValue(pendingIncidentsRef, handleIncidentData)

        return () => {
            unsubscribe()
        }

    }, [])

    return (
        <div>
            {incidents.length > 0 ? (
                <ul>
                    {incidents.map(incident => (
                        <li
                            key={incident.id}
                            onClick={() => onIncidentClick(incident.id)}
                            className="p-2 cursor-pointer flex items-center border-b border-gray-200 hover:bg-gray-100"
                        >
                            <div className="flex-shrink-0 rounded-full h-20 w-20 overflow-hidden mr-4">
                                <img
                                    className="h-full w-full object-cover rounded-full"
                                    src='https://cdn-icons-png.flaticon.com/512/4781/4781517.png'
                                    alt={incident.locationName}
                                />
                            </div>
                            <div>
                                <strong className="block text-base font-semibold">{incident.locationName}</strong>
                                <p className="text-gray-600 text-sm">
                                    {incident.lastMessage.slice(0, 30)}
                                    {incident.lastMessage.length > 30 && '...'}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No incidents available</p>
            )}
        </div>
    )
}

export default Chatlist
