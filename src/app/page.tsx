'use client'
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import lottie from 'lottie-web';

import 'mapbox-gl/dist/mapbox-gl.css';
import { db } from './firebaseConfig';
import { equalTo, get, onValue, orderByChild, push, query, ref, update } from 'firebase/database';

export default function Dashboard() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | undefined>();
  const [pendingIncidents, setPendingIncidents] = useState<any[]>([]);
  const [modalVisibility, setModalVisibility] = useState<{ [key: string]: boolean }>({});
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const incidentMarkers = new Map();
  const rescuerMarkers = new Map();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    mapboxgl.accessToken = 'pk.eyJ1IjoiYWJpc29pdmMiLCJhIjoiY2x5eDh0Z2k0MDcwNTJrcHN0aXl1anA2MiJ9.S94O4y8MKnzyyH7dS_thFw';

    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [121.0794793, 14.6230989],
        zoom: 17
      });
    }

    return () => {

    };
  }, []);

  useEffect(() => {
    const lottieContainers = [
      'lottie-fire',
      'lottie-flood',
      'lottie-earthquake',
      'lottie-manmade',
      'lottie-car',
    ];

    const lottieAnimations = lottieContainers.map(id => {
      const container = document.getElementById(id);
      if (container) {
        return lottie.loadAnimation({
          container,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: `/animations/${id.replace('lottie-', '')}.json`
        });
      }
      return null;
    });

    return () => {
      lottieAnimations.forEach(animation => {
        if (animation) {
          animation.destroy();
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const incidentRef = ref(db, 'incidents');
    const pendingIncidentsQuery = query(incidentRef, orderByChild('status'), equalTo('pending'));

    const handleIncidents = (snapshot: any) => {
      const newPendingIncidents: any[] = [];
      const currentIncidentIds = new Set<string>();
      const currentRescuerIds = new Set<string>();

      snapshot.forEach((child: any) => {
        const incident = child.val();
        const id = child.key;
        const datetime = new Date(incident.timestamp);

        newPendingIncidents.push({
          id,
          locationName: incident.locationName,
          datetime: datetime.toLocaleString(),
          userName: incident.userName,
          userMobile: incident.userMobile,
          latitude: incident.location.latitude,
          longitude: incident.location.longitude,
          ...incident,
        });

        currentIncidentIds.add(id);

        const rescuers = incident.rescuers;
        if (rescuers) {
          const rescuerIds = Object.keys(rescuers);
          rescuerIds.forEach((rescuerId) => {
            currentRescuerIds.add(rescuerId);
            const rescuer = incident.rescuers[rescuerId];
            const rescuerLocation = rescuer.location;

            if (rescuerLocation) {
              const { latitude, longitude } = rescuerLocation;

              if (!rescuerMarkers.has(rescuerId)) {
                const lottieContainer = document.createElement('div');
                lottieContainer.style.width = '100px';
                lottieContainer.style.height = '100px';

                lottie.loadAnimation({
                  container: lottieContainer,
                  renderer: 'svg',
                  loop: true,
                  autoplay: true,
                  path: '/animations/car.json',
                });

                const marker = new mapboxgl.Marker(lottieContainer)
                  .setLngLat([longitude, latitude])
                  .addTo(mapRef.current!);

                marker.getElement().addEventListener('click', () => {
                  const rescuerRef = ref(db, `users/${rescuerId}`);
                  get(rescuerRef).then((snapshot) => {
                    const name = snapshot.val().name;
                    const mobile = snapshot.val().mobile;
                    const locationName = incident.locationName;
                    setSelectedIncident({ rescueType: 'rescuer', ...rescuer, latitude, longitude, name, mobile, locationName });
                  });
                });

                rescuerMarkers.set(rescuerId, marker);
              } else {
                const existingMarker = rescuerMarkers.get(rescuerId);
                existingMarker.setLngLat([longitude, latitude]);
              }
            }
          });
        }

        setModalVisibility((prev) => ({ ...prev, [id]: true }));

        if (incident.notified) {
          setModalVisibility((prev) => ({ ...prev, [id]: false }));
        }

        if (incident.location) {
          const { latitude, longitude } = incident.location;

          if (incidentMarkers.has(id)) {
            const existingMarker = incidentMarkers.get(id);
            existingMarker.setLngLat([longitude, latitude]);

            console.log(`Marker updated for incident ${incident.id} at ${latitude}, ${longitude}`);
          } else {
            const lottieContainer = document.createElement('div');
            lottieContainer.id = `lottie-${id}`;
            lottieContainer.style.width = '100px';
            lottieContainer.style.height = '100px';

            lottie.loadAnimation({
              container: lottieContainer,
              renderer: 'svg',
              loop: true,
              autoplay: true,
              path: `/animations/${incident.type}.json`,
            });

            const marker = new mapboxgl.Marker(lottieContainer)
              .setLngLat([longitude, latitude])
              .addTo(mapRef.current!);

            marker.getElement().addEventListener('click', () => {
              setSelectedIncident({ rescueType: 'incident', ...incident, latitude, longitude });
            });

            incidentMarkers.set(id, marker);
          }
        }
      });

      incidentMarkers.forEach((marker, id) => {
        if (!currentIncidentIds.has(id)) {
          marker.remove();
          incidentMarkers.delete(id);
        }
      });

      rescuerMarkers.forEach((marker, rescuerId) => {
        if (!currentRescuerIds.has(rescuerId)) {
          marker.remove();
          rescuerMarkers.delete(rescuerId);
        }
      });

      setPendingIncidents(newPendingIncidents);
    };

    const unsubscribe = onValue(pendingIncidentsQuery, handleIncidents);

    return () => {
      unsubscribe();
    };
  }, []);



  // const handleAcceptIncident = (id: string) => {
  //   const incidentRef = ref(db, `incidents/${id}`);
  //   const messageRef = ref(db, `incidents/${id}/messages`);

  //   get(incidentRef).then((snapshot) => {
  //     const numberOfRescuers = snapshot.val().numberofRescuer;
  //     update(incidentRef, {
  //       numberofRescuer: numberOfRescuers + 1,
  //       notified: true,
  //     });
  //     const newMessage = {
  //       type: 'text',
  //       text: "🚨 We are notified and on our way! \nYou may or may not see the rescuer's current location due to possible network issues, but rest assured that help is on the way. \n\n🕊️ Please stay calm and, if possible, send a picture or proof of the current situation to assist us in reaching you more efficiently. 📸",
  //       userType: 'rescuer',
  //       timestamp: Date.now(),
  //     };

  //     push(messageRef, newMessage);
  //     setModalVisibility((prev) => ({ ...prev, [id]: false }));
  //   });

  // };

  // const handleRejectIncident = (id: string) => {
  //   setModalVisibility((prev) => ({ ...prev, [id]: false }));
  // };

  return (
    <>
      <div
        style={{ height: '100%' }}
        ref={mapContainerRef}
        className="map-container overflow-hidden rounded-l-3xl -z-10"
      ></div>

      {selectedIncident && (
        <div
          className="modal-container fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center z-50 bg-gray-800 bg-opacity-75"
        >
          <div className="modal-content bg-white p-4 rounded">
            <h2 className="text-xl font-bold mb-2">{selectedIncident.rescueType === 'incident' ? 'Incident Details' : 'Rescuer Details'}</h2>
            <p><strong>Location:</strong> {selectedIncident.latitude}, {selectedIncident.longitude}</p>
            {selectedIncident.rescueType === 'incident' && (
              <>
                <p><strong>Location Name:</strong> {selectedIncident.locationName}</p>
                <p><strong>Date and Time:</strong> {new Date(selectedIncident.timestamp).toLocaleString()}</p>
                <p><strong>User Name:</strong> {selectedIncident.userName}</p>
                <p><strong>User Mobile:</strong> {selectedIncident.userMobile}</p>
              </>
            )}
            {selectedIncident.rescueType === 'rescuer' && (
              <>
                <p><strong>Destination:</strong> {selectedIncident.locationName}</p>
                <p><strong>Rescuer Name:</strong> {selectedIncident.name}</p>
                <p><strong>Rescuer Mobile:</strong> {selectedIncident.mobile}</p>
              </>
            )}
            <button onClick={() => setSelectedIncident(null)} className="mt-2 bg-gray-500 text-white px-4 py-2 rounded">
              Close
            </button>
          </div>
        </div>
      )}

      <div className='absolute top-6 right-6 bg-white px-4 py-2 rounded-xl'>
        <h1 className='text-base font-bold'>Pending Incidents</h1>
        <div className='overflow-y-scroll max-h-56'>
          {pendingIncidents.map((incident) => (
            <div className='bg-gray-50 shadow-xl p-2 my-2' key={incident.id}>
              <div className='flex flex-row items-center gap-2 justify-between'>
                <p>{incident.locationName}</p>
                {incident.numberofRescuer > 0 ? (
                  <p className='text-black/20'>Accepted</p>
                ) : (
                  <p className='text-red-500'>No Rescuer</p>
                )}
              </div>
                <div className='flex flex-col items-start gap-2'>
                  <p>{incident.userName} - {incident.userMobile}</p>
                  <p>{incident.datetime}</p>
                  <p>Rescuer&apos;s ongoing: {incident.numberofRescuer}</p>
                </div>
            </div>
          ))}
        </div>
      </div>

      <div className='absolute bottom-2 right-2 z-10 flex flex-row gap-2 px-4 py-2 bg-white rounded-3xl'>
        <div className='flex flex-row items-center'>
          <div id='lottie-fire' className='w-10 h-10'></div>
          <p className='font-bold text-red-500'>Fire</p>
        </div>
        <div className='flex flex-row items-center'>
          <div id='lottie-flood' className='w-10 h-10'></div>
          <p className='font-bold text-blue-500'>Flood</p>
        </div>
        <div className='flex flex-row items-center'>
          <div id='lottie-earthquake' className='w-10 h-10'></div>
          <p className='font-bold text-amber-500'>Earthquake</p>
        </div>
        <div className='flex flex-row items-center'>
          <div id='lottie-manmade' className='w-10 h-10'></div>
          <p className='font-bold text-gray-500'>ManMade</p>
        </div>
        <div className='flex flex-row items-center'>
          <div id='lottie-car' className='w-10 h-10'></div>
          <p className='font-bold text-green-500'>Rescuer</p>
        </div>
      </div>
    </>
  );
}
