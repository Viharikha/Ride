import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';

const App = () => {
  const [cabData, setCabData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filePath = 'C:/Users/vihar/OneDrive/Desktop/final_clusters.csv'; // Path to CSV file in the public directory

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(filePath);
        processCSV(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const processCSV = (csvData) => {
    Papa.parse(csvData, {
      header: true,
      complete: async (results) => {
        const parsedData = results.data;

        const cabMap = parsedData.reduce((acc, row) => {
          const cabId = row['CAB_ID'];

          if (!acc[cabId]) {
            acc[cabId] = {
              capacity: row['CAPACITY'],
              employees: []
            };
          }

          acc[cabId].employees.push({
            empId: row['EMP_ID'],
            latitude: row['Latitude'],
            longitude: row['Longitude']
          });

          return acc;
        }, {});

        // Fetch location names for all employees
        for (const cabId in cabMap) {
          const cab = cabMap[cabId];
          for (const employee of cab.employees) {
            const locationName = await getLocationName(employee.latitude, employee.longitude);
            employee.locationName = locationName;
          }
        }

        setCabData(cabMap);
      },
      error: (error) => setError(error.message),
    });
  };

  const getLocationName = async (latitude, longitude) => {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
          addressdetails: 1
        }
      });
      return response.data.display_name || 'Unknown location';
    } catch (error) {
      console.error('Error in reverse geocoding:', error);
      return 'Unknown location';
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading data: {error}</p>;

  return (
    <div>
      {Object.entries(cabData).map(([cabId, cab]) => (
        <div key={cabId}>
          <h2>Cab ID: {cabId}</h2>
          <p>Capacity: {cab.capacity}</p>
          <h3>Employees and Locations:</h3>
          {cab.employees.map((employee) => (
            <div key={employee.empId}>
              <p>Employee ID: {employee.empId}</p>
              <p>Location - Latitude: {employee.latitude}, Longitude: {employee.longitude}</p>
              <p>Location Name: {employee.locationName}</p>
            </div>
          ))}
          <hr />
        </div>
      ))}
    </div>
  );
};

export default App;
