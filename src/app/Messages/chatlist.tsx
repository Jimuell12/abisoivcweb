'use client'
import React, { useEffect, useState } from 'react'
import { db } from '../firebaseConfig'
import { onValue, ref } from 'firebase/database'
import { useRouter } from 'next/navigation'

interface ChatUser {
    id: string
    userImage: string
    locationName: string
    lastMessage: string
    timestamp: number
}

function Chatlist({ onUserClick }: { onUserClick: (id: string) => void }) {
    const [users, setUsers] = useState<ChatUser[]>([])
    const router = useRouter()

    useEffect(() => {
        const incidentsRef = ref(db, 'incidents')

        const handleIncidentData = (snapshot: any) => {
            if (snapshot.exists()) {
                let userChats: { [key: string]: ChatUser } = {}

                snapshot.forEach((incidentSnapshot: any) => {
                    const incident = incidentSnapshot.val()
                    const incidentKey = incidentSnapshot.key
                    const messages = incident.messages || {}

                    // Update or add users based on messages
                    Object.values(messages).forEach((message: any) => {
                        const senderId = incident.reportedBy
                        const senderLocation = incident.locationName

                        const lastMessage = message.text
                        const timestamp = message.timestamp

                        if (!userChats[senderId]) {
                            userChats[senderId] = {
                                id: incidentKey,
                                userImage: 'https://cdn-icons-png.flaticon.com/512/4781/4781517.png',
                                locationName: senderLocation,
                                lastMessage,
                                timestamp
                            }
                        } else {
                            userChats[senderId].lastMessage = lastMessage
                            userChats[senderId].timestamp = timestamp
                        }
                    })
                })

                setUsers(Object.values(userChats).sort((a, b) => b.timestamp - a.timestamp)) // Sort users by latest message
            } else {
                console.log('No data available')
            }
        }

        const unsubscribe = onValue(incidentsRef, handleIncidentData)

        return () => {
            unsubscribe()
        }

    }, [])


    return (
        <div>
            {users.length > 0 ? (
                <ul>
                    {users.map(user => (
                        <li
                            key={user.id}
                            onClick={() => onUserClick(user.id)}
                            className="p-2 cursor-pointer flex items-center border-b border-gray-200 hover:bg-gray-100"
                        >
                            <div className="flex-shrink-0 rounded-full h-20 w-20 overflow-hidden mr-4">
                                <img
                                    className="h-full w-full object-cover rounded-full"
                                    src={user.userImage}
                                    alt={user.locationName}
                                />
                            </div>
                            <div>
                                <strong className="block text-base font-semibold">{user.locationName}</strong>
                                <p className="text-gray-600 text-sm">
                                    {user.lastMessage.slice(0, 30)}
                                    {user.lastMessage.length > 30 && '...'}
                                </p>
                            </div>
                        </li>

                    ))}
                </ul>
            ) : (
                <p>No users available</p>
            )}
        </div>
    )
}

export default Chatlist
