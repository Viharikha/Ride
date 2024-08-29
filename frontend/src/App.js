import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import './App.css'; // Import the CSS file

const App = () => {
  const [cabData, setCabData] = useState({});
  const [error, setError] = useState(null);
  const [selectedCabId, setSelectedCabId] = useState('');

  useEffect(() => {
    if (Object.keys(cabData).length > 0 && !selectedCabId) {
      setSelectedCabId(Object.keys(cabData)[0]);
    }
  }, [cabData]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => processCSV(results.data),
        error: (error) => setError(error.message),
      });
    }
  };

  const processCSV = (parsedData) => {
    const cabMap = parsedData.reduce((acc, row) => {
      const cabId = row['CAB_ID'];

      if (!acc[cabId]) {
        acc[cabId] = {
          driver: row['DRIVER_NAME'],
          capacity: row['CAPACITY'],
          employees: []
        };
      }

      acc[cabId].employees.push({
        empId: row['EMP_ID'],
        latitude: row['Latitude'],
        longitude: row['Longitude'],
        address: null,
      });

      return acc;
    }, {});

    Object.values(cabMap).forEach((cab) => {
      cab.employees.forEach((employee) => {
        fetchAddress(employee.latitude, employee.longitude)
          .then(address => {
            employee.address = address;
            setCabData((prevData) => ({ ...prevData }));
          })
          .catch(err => console.error('Error fetching address:', err));
      });
    });

    setCabData(cabMap);
  };

  const fetchAddress = async (latitude, longitude) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`);
      const data = await response.json();
      if (data && data.display_name) {
        return data.display_name;
      } else {
        return 'Address not found';
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      return 'Error fetching address';
    }
  };

  return (
    <div className="container">
      <input type="file" accept=".csv" onChange={handleFileChange} />
      {error && <p className="error">Error: {error}</p>}

      {Object.keys(cabData).length === 0 ? (
        <p>No data available. Please upload a CSV file.</p>
      ) : (
        <div>
          <h2>Select a Cab</h2>
          <select
            value={selectedCabId}
            onChange={(e) => setSelectedCabId(e.target.value)}
          >
            {Object.keys(cabData).map((cabId) => (
              <option key={cabId} value={cabId}>
                {cabId}
              </option>
            ))}
          </select>

          {selectedCabId && (
            <div className="details">
              <h2>Cab ID: {selectedCabId}</h2>
              <p>Driver: {cabData[selectedCabId].driver}</p>
              <p>Capacity: {cabData[selectedCabId].capacity}</p>
              <h3>Employees and Locations:</h3>
              {cabData[selectedCabId].employees.map((employee) => (
                <div key={employee.empId}>
                  <p>Employee ID: {employee.empId}</p>
                  <p>Location - Latitude: {employee.latitude}, Longitude: {employee.longitude}</p>
                 
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
