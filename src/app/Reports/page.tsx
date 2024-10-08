'use client'
import { onValue, ref, set } from 'firebase/database'
import React, { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { db } from '../firebaseConfig'


export default function Settings() {
  const [incidentsList, setIncidentsList] = useState<any[]>([]);
  const [monthlyIncidents, setMonthlyIncidents] = useState<any[]>([]);
  const [dailyIncidents, setDailyIncidents] = useState<any[]>([]);
  const [showTable, setShowTable] = useState(false);
  const [showTable2, setShowTable2] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [years, setYears] = useState<string[]>([]);

  useEffect(() => {
    const incidentsRef = ref(db, 'incidents');

    const handleIncidents = (snapshot: any) => {
      const incidents: any = [];
      snapshot.forEach((childSnapshot: any) => {
        incidents.push({
          ...childSnapshot.val(),
          key: childSnapshot.key
        });
      });
      setIncidentsList(incidents);

      const uniqueYears = Array.from(new Set(incidents.map((incident: any) => new Date(incident.timestamp).getFullYear())));
      uniqueYears.sort((a : any, b : any) => a - b);
      setYears(uniqueYears as string[]);
    };

    const unsubscribe = onValue(incidentsRef, handleIncidents);

    return () => {
      unsubscribe();
    };
  }, []);

  const groupedIncidents = incidentsList.reduce((acc, incident) => {
    const date = new Date(incident.timestamp).toLocaleDateString('en', { year: 'numeric' });
    if (!acc[incident.type]) {
      acc[incident.type] = {};
    }
    if (!acc[incident.type][date]) {
      acc[incident.type][date] = 0;
    }
    acc[incident.type][date] += 1;
    return acc;
  }, {});

  const prepareChartData = (groupedData: any) => {
    const chartData: any = {};
    Object.keys(groupedData).forEach(type => {
      chartData[type] = Object.entries(groupedData[type]).map(([date, count]) => ({
        date,
        count
      }));
    });
    return chartData;
  };
  
  const chartData: any[] = prepareChartData(groupedIncidents);

  const handleDateSelected = (e: any) => {
    const date = e.target.value;
    if(date === '') return;
    setSelectedDate(date);
    const filteredIncidents = incidentsList.filter((incident) => {
      const incidentDate = new Date(incident.timestamp).toLocaleDateString('en', { year: 'numeric' });
      return incidentDate === date;
    });

    const monthlyData = filteredIncidents.reduce((acc: any, incident: any) => {
      const month = new Date(incident.timestamp).toLocaleDateString('en', { month: 'short' });
      if (!acc[incident.type]) {
        acc[incident.type] = { Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0, Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0 };
      }
      acc[incident.type][month] += 1;
      return acc;
    }, {});

    setMonthlyIncidents(Object.entries(monthlyData));
    setShowTable(true);
  }

  const handleMonthSelected = (e: any) => {
    const month = e.target.value;
    if(month === '') return;
    const year = selectedDate;
    const filteredIncidents = incidentsList.filter((incident) => {
      const incidentMonth = new Date(incident.timestamp).toLocaleDateString('en', { month: 'long' });
      const incidentYear = new Date(incident.timestamp).toLocaleDateString('en', { year: 'numeric' });
      return incidentMonth === month && incidentYear === year;
    });

    const daily = Object.entries(filteredIncidents).map(([date, incident]) => ({
      date: new Date(incident.timestamp).toLocaleDateString('en', { month: 'long' ,day: '2-digit' }),
      type: incident.type,
      location: incident.locationName
    }))

    setDailyIncidents(daily);
    console.log(daily)
    setShowTable2(true);
  }

  return (
    <div className='p-4 h-screen overflow-y-scroll'>
      <div className='flex flex-row justify-between'>
        <h1 className='text-2xl font-bold'>Incident Reports</h1>
        <select name="date" id="date" onChange={handleDateSelected}>
          <option value="">Select Year</option>
          {years.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>


      </div>
      <div className='grid lg:grid-cols-2 lg:grid-rows-2 p-4 gap-4'>
        {Object.entries(chartData).map(([type, incidents]) => (
          <div key={type} className='border p-4 rounded-lg shadow-md flex-wrap'>
            <h2 className='text-xl font-bold mb-2 capitalize'>{type} Incidents</h2>
            <LineChart
              width={400}
              height={200}
              data={incidents}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8884d8" />
              <Legend />
            </LineChart>
          </div>
        ))}
      </div>

      {showTable && (
        <div className='fixed top-0 left-0 w-full h-full bg-white p-4 shadow-lg z-10'>
          <div className='flex flex-row justify-between'>
            <button onClick={() => setShowTable(false)} className='mb-4 p-2 bg-red-500 text-white rounded'>Close</button>
            <select name="date" id="date" onChange={handleMonthSelected}>
              <option value="">Select Month</option>
              <option value="January">January</option>
              <option value="February">February</option>
              <option value="March">March</option>
              <option value="April">April</option>
              <option value="May">May</option>
              <option value="June">June</option>
              <option value="July">July</option>
              <option value="August">August</option>
              <option value="September">September</option>
              <option value="October">October</option>
              <option value="November">November</option>
              <option value="December">December</option>
            </select>
          </div>
          <h2 className='text-xl font-bold mb-2'>Monthly Incident Counts</h2>
          <table className='min-w-full'>
            <thead className='bg-gray-50 whitespace-nowrap rounded-xl"'>
              <tr>
                <th className='p-4 text-left text-sm font-bold text-gray-500'>Disaster</th>
                <th className='p-4 text-left text-sm font-bold text-gray-500'>Jan</th>
                <th className='p-4 text-left text-sm font-bold text-gray-500'>Feb</th>
                <th className='p-4 text-left text-sm font-bold text-gray-500'>Mar</th>
                <th className='p-4 text-left text-sm font-bold text-gray-500'>Apr</th>
                <th className='p-4 text-left text-sm font-bold text-gray-500'>May</th>
                <th className='p-4 text-left text-sm font-bold text-gray-500'>Jun</th>
                <th className='p-4 text-left text-sm font-bold text-gray-500'>Jul</th>
                <th className='p-4 text-left text-sm font-bold text-gray-500'>Aug</th>
                <th className='p-4 text-left text-sm font-bold text-gray-500'>Sep</th>
                <th className='p-4 text-left text-sm font-bold text-gray-500'>Oct</th>
                <th className='p-4 text-left text-sm font-bold text-gray-500'>Nov</th>
                <th className='p-4 text-left text-sm font-bold text-gray-500'>Dec</th>
              </tr>
            </thead>
            <tbody className="whitespace-nowrap">
              {monthlyIncidents.map(([type, counts]) => (
                <tr className='hover:bg-gray-50' key={type}>
                  <th className="p-4 text-sm text-gray-500 text-left">{type}</th>
                  {Object.values(counts).map((count, index) => (
                    <th className="p-4 text-sm text-gray-500 text-left" key={index}>{String(count)}</th>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showTable2 && (
        <div className='fixed top-0 left-0 w-full h-full bg-white p-4 shadow-lg z-10'>
          <div className='flex flex-row justify-between'>
            <button onClick={() => setShowTable2(false)} className='mb-4 p-2 bg-red-500 text-white rounded'>Close</button>
          </div>
          <h2 className='text-xl font-bold mb-2'>Daily Incident Counts</h2>
          <table className='min-w-full'>
            <thead className='bg-gray-50 whitespace-nowrap rounded-xl"'>
              <tr>
                <th className='p-4 text-left text-sm font-bold text-gray-500'>Date</th>
                <th className='p-4 text-left text-sm font-bold text-gray-500'>Incident</th>
                <th className='p-4 text-center text-sm font-bold text-gray-500'>Location</th>
              </tr>
            </thead>
            <tbody className="whitespace-nowrap">
              {dailyIncidents.map((incident) => (
                <tr className='hover:bg-gray-50' key={incident.date}>
                  <th className="p-4 text-sm text-gray-500 text-left">{incident.date}</th>
                  <th className="p-4 text-sm text-gray-500 text-left">{incident.type}</th>
                  <th className="p-4 text-sm text-gray-500 text-center">{incident.location}</th>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

  );
}
