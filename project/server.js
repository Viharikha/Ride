const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const port = 8002;

// MySQL connection setup
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'allocation',
  port: 3307
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Database connected');
});

app.use(cors());

// Endpoint to get cab IDs
app.get('/api/cabs', (req, res) => {
  const query = 'SELECT CAB_NUMBER FROM ride'; // Adjust the query as needed
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching cab IDs:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    const cabIds = results.map(row => row.CAB_NUMBER);
    res.json(cabIds);
  });
});
app.get('/api/cabs/:cabId', (req, res) => {
  const cabId = req.params.cabId;
  const query = `
    SELECT r.*, c.DRIVER_NAME, c.CAPACITY, e.EMPLOYEE_NAME, e.LATITUDE, e.LONGITUDE
    FROM ride r
    JOIN cab_details c ON r.CAB_NUMBER = c.CAB_NUMBER
    LEFT JOIN employees e ON e.CAB_NUMBER = r.CAB_NUMBER
    WHERE r.CAB_NUMBER = ?
  `;
  db.query(query, [cabId], (err, results) => {
    if (err) {
      console.error('Error fetching cab details:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    const cabDetails = results.reduce((acc, row) => {
      if (!acc[row.CAB_NUMBER]) {
        acc[row.CAB_NUMBER] = {
          driver: row.DRIVER_NAME,
          capacity: row.CAPACITY,
          employees: []
        };
      }
      if (row.EMPLOYEE_NAME) {
        acc[row.CAB_NUMBER].employees.push({
          empId: row.EMP_ID,
          latitude: row.LATITUDE,
          longitude: row.LONGITUDE
        });
      }
      return acc;
    }, {});
    res.json(cabDetails[cabId] || {});
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
