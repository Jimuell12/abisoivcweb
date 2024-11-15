"use client";
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import lottie from 'lottie-web';
import 'mapbox-gl/dist/mapbox-gl.css';
import { db } from '../firebaseConfig';
import { get, ref, query, orderByChild, equalTo, set } from 'firebase/database';
import Select from 'react-select';

export default function Dashboard() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | undefined>();
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [allIncidents, setAllIncidents] = useState<any[]>([]); // Store all incidents to filter by year
  const [selectedIncidentType, setSelectedIncidentType] = useState<string>(''); // State to track selected type
  const [incidents, setIncidents] = useState<any[]>([]); // Store incidents to filter locally
  const incidentMarkers = useRef<Map<string, mapboxgl.Marker>>(new Map()); // Track markers for cleanup
  const [years, setYears] = useState<string[]>([]);

  const options = years.map(year => ({
    value: year.toString(),  // The actual value that will be passed on selection
    label: year.toString()  // The label to be displayed in the dropdown
  }));
  options.unshift({ value: '', label: 'Select Year' });

  // Initialize map
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

    return () => { };
  }, []);

  // Load Lottie animations
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

  // Fetch incidents from Firebase
  useEffect(() => {
    const fetchIncidents = async () => {
      const incidentRef = ref(db, 'incidents');
      const pendingIncidentsQuery = query(incidentRef, orderByChild('status'), equalTo('resolved'));

      try {
        const snapshot = await get(pendingIncidentsQuery);

        if (!snapshot.exists()) {
          console.log('No incidents found');
          return;
        }

        const newIncidents: any[] = [];
        snapshot.forEach((child: any) => {
          const incident = child.val();
          const id = child.key;
          const datetime = new Date(incident.timestamp);

          newIncidents.push({
            id,
            locationName: incident.locationName,
            datetime: datetime.toLocaleString(),
            userName: incident.userName,
            userMobile: incident.userMobile,
            latitude: incident.location.latitude,
            longitude: incident.location.longitude,
            ...incident,
          });
        });

        setAllIncidents(newIncidents); // Save all incidents to state
        setIncidents(newIncidents); // Save all incidents to state
        const uniqueYears = Array.from(new Set(newIncidents.map((incident: any) => new Date(incident.datetime).getFullYear())));
        uniqueYears.sort((a: any, b: any) => a - b);
        setYears(uniqueYears as unknown as string[]);
      } catch (error) {
        console.error('Error fetching incidents:', error);
      }
    };

    fetchIncidents();
  }, []);

  // Update the markers on the map based on the selected type
  useEffect(() => {
    if (!mapRef.current || incidents.length === 0) return;

    // Remove old markers
    incidentMarkers.current.forEach(marker => marker.remove());
    incidentMarkers.current.clear();

    const filteredIncidents = selectedIncidentType
      ? incidents.filter(incident => incident.type === selectedIncidentType) // Only show incidents of the selected type
      : incidents; // Show all incidents if no type is selected

    // Add new markers
    filteredIncidents.forEach((incident) => {
      const { latitude, longitude, id, type } = incident;
      const lottieContainer = document.createElement('div');
      lottieContainer.id = `lottie-${id}`;
      lottieContainer.style.width = '100px';
      lottieContainer.style.height = '100px';

      lottie.loadAnimation({
        container: lottieContainer,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: `/animations/${type}.json`,
      });

      const marker = new mapboxgl.Marker(lottieContainer)
        .setLngLat([longitude, latitude])
        .addTo(mapRef.current!);

      marker.getElement().addEventListener('click', () => {
        setSelectedIncident({ rescueType: 'incident', ...incident });
      });

      incidentMarkers.current.set(id, marker);
    });
  }, [selectedIncidentType, incidents]); // Update markers whenever selected type or incidents change

  // Handle the incident type selection (toggle functionality)
  const handleTypeClick = (type: string) => {
    if (selectedIncidentType === type) {
      setSelectedIncidentType(''); // Deselect if the same type is clicked
    } else {
      setSelectedIncidentType(type); // Select the new type
    }
  };

  const handleChangeYear = (year: string) => {
    if (year === '') {
      setIncidents(allIncidents); // Reset to all incidents if no year is selected
      return;
    }

    const newIncidents = allIncidents.filter((incident: any) => new Date(incident.datetime).getFullYear().toString() === year);
    setIncidents(newIncidents);
  }

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

      <div className='absolute top-2 right-2 z-10'>
        <Select
          className="w-48"
          options={options}
          onChange={(selectedOption) => handleChangeYear(selectedOption?.value || '')}
          placeholder="Select Year"
        />
      </div>

      <div className='absolute bottom-2 cursor-pointer right-2 z-10 flex flex-row gap-2 px-4 py-2 bg-white rounded-3xl'>
        {/* Fire */}
        <div
          className={`flex flex-row items-center px-1 rounded-xl hover:bg-red-100 ${selectedIncidentType === 'fire' ? 'bg-red-100' : 'bg-white'}`}
          onClick={() => handleTypeClick('fire')}
        >
          <div id='lottie-fire' className='w-10 h-10'></div>
          <p className={`font-bold ${selectedIncidentType === 'fire' ? 'text-red-700' : 'text-red-500'}`}>Fire</p>
        </div>

        {/* Flood */}
        <div
          className={`flex flex-row items-center px-1 rounded-xl hover:bg-blue-100 ${selectedIncidentType === 'flood' ? 'bg-blue-100' : 'bg-white'}`}
          onClick={() => handleTypeClick('flood')}
        >
          <div id='lottie-flood' className='w-10 h-10'></div>
          <p className={`font-bold ${selectedIncidentType === 'flood' ? 'text-blue-700' : 'text-blue-500'}`}>Flood</p>
        </div>

        {/* Earthquake */}
        <div
          className={`flex flex-row items-center px-1 rounded-xl hover:bg-amber-100 ${selectedIncidentType === 'earthquake' ? 'bg-amber-100' : 'bg-white'}`}
          onClick={() => handleTypeClick('earthquake')}
        >
          <div id='lottie-earthquake' className='w-10 h-10'></div>
          <p className={`font-bold ${selectedIncidentType === 'earthquake' ? 'text-amber-700' : 'text-amber-500'}`}>Earthquake</p>
        </div>

        {/* ManMade */}
        <div
          className={`flex flex-row items-center px-1 rounded-xl hover:bg-gray-300 ${selectedIncidentType === 'manmade' ? 'bg-gray-300' : 'bg-white'}`}
          onClick={() => handleTypeClick('manmade')}
        >
          <div id='lottie-manmade' className='w-10 h-10'></div>
          <p className={`font-bold ${selectedIncidentType === 'manmade' ? 'text-gray-700' : 'text-gray-500'}`}>ManMade</p>
        </div>
      </div>

    </>
  );
}
