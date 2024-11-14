"use client"
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import lottie from 'lottie-web';
import 'mapbox-gl/dist/mapbox-gl.css';
import { db } from '../firebaseConfig';
import { get, ref, query, orderByChild, equalTo } from 'firebase/database';

export default function Dashboard() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | undefined>();
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const incidentMarkers = new Map();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    mapboxgl.accessToken = 'pk.eyJ1IjoiYWJpc29pdmMiLCJhIjoiY2x5eDh0Z2k0MDcwNTJrcHN0aXl1anA2MiJ9.S94O4y8MKnzyyH7dS_thFw';

    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [121.0794793, 14.6230989],
        zoom: 17,
      });
    }

    return () => {};
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
          path: `/animations/${id.replace('lottie-', '')}.json`,
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

    const fetchIncidents = async () => {
      const incidentRef = ref(db, 'incidents');
      const pendingIncidentsQuery = query(incidentRef, orderByChild('status'), equalTo('resolved'));

      try {
        const snapshot = await get(pendingIncidentsQuery);

        if (!snapshot.exists()) {
          console.log('No incidents found');
          return;
        }

        const newPendingIncidents: any[] = [];
        const currentIncidentIds = new Set<string>();

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

      } catch (error) {
        console.error('Error fetching incidents:', error);
      }
    };

    fetchIncidents();
  }, []); // Only runs once when the component mounts

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
            <h2 className="text-xl font-bold mb-2">Incident Details</h2>
            <p><strong>Location:</strong> {selectedIncident.latitude}, {selectedIncident.longitude}</p>
            {selectedIncident.rescueType === 'incident' && (
              <>
                <p><strong>Location Name:</strong> {selectedIncident.locationName}</p>
                <p><strong>Date and Time:</strong> {new Date(selectedIncident.timestamp).toLocaleString()}</p>
                <p><strong>User Name:</strong> {selectedIncident.userName}</p>
                <p><strong>User Mobile:</strong> {selectedIncident.userMobile}</p>
              </>
            )}
            <button onClick={() => setSelectedIncident(null)} className="mt-2 bg-gray-500 text-white px-4 py-2 rounded">
              Close
            </button>
          </div>
        </div>
      )}

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
      </div>
    </>
  );
}
