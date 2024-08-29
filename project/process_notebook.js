const fs = require('fs');

// Option 1: Using double backslashes
const filePath = 'C:\\Users\\vihar\\OneDrive\\Desktop\\emp_clustering_final.ipynb';


fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }
  const notebook = JSON.parse(data);
  console.log(notebook.metadata);
});


