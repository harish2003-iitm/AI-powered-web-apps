import React, { useState, useEffect, useRef } from 'react';
import { fetchApi } from '../../utils/api';
import './CustomerDataUpload.css';
import Papa from 'papaparse';

interface Customer {
  id: string;
  name: string;
  email: string;
  age?: number;
  gender?: string;
  location?: string;
  registrationDate: string;
  lastLoginDate?: string;
  preferences?: string[];
  tags?: string[];
}

const CustomerDataUpload: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{ message: string; isError: boolean }>({ message: '', isError: false });
  const [importProgress, setImportProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await fetchApi('/api/recommendation/customers');
        setCustomers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError('Failed to load customers');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCustomers();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportStatus({ message: "Processing customer CSV...", isError: false });
    setImportProgress(0);
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: (header: string) => header.trim().toLowerCase(),
        complete: (results) => {
          console.log("CSV parsing complete", results);
          
          if (results.data.length === 0) {
            setImportStatus({
              message: "The CSV file appears to be empty. Please check the file and try again.",
              isError: true
            });
            return;
          }
          
          // First, analyze CSV structure to understand available fields
          const sampleRow = results.data[0];
          const availableFields = Object.keys(sampleRow || {});
          console.log("Available fields in CSV:", availableFields);
          
          // Attempt to identify key fields from what's available in the CSV
          const nameFields = ['name', 'customer name', 'customername', 'full name', 'fullname', 'firstname', 'first name', 'customer'];
          const emailFields = ['email', 'email address', 'emailaddress', 'mail', 'e-mail'];
          
          // Find the best field matches
          const nameField = nameFields.find(field => availableFields.includes(field));
          const emailField = emailFields.find(field => availableFields.includes(field));
          
          console.log(`Identified key fields - Name: ${nameField}, Email: ${emailField}`);
          
          // Consider all rows valid, but try to extract sensible data
          const customers = results.data
            .filter((row: any) => row && typeof row === 'object')
            .map((item: any, index: number) => {
              // Generate an ID if not present
              const id = findValue(item, ['id', 'customerid', 'customer id', 'customer_id']) || 
                        `cust-${Date.now()}-${index}`;
              
              // Extract name using the identified field or a fallback strategy
              const name = findValue(item, nameFields) || 
                         (item.firstname && item.lastname ? `${item.firstname} ${item.lastname}` : 
                         item.firstname || item.lastname || `Customer ${index + 1}`);
              
              // Extract email using the identified field
              const email = findValue(item, emailFields) || '';
              
              // Other fields with fallbacks
              const preferences = extractArrayField(item, ['preferences', 'interests', 'likes']);
              const tags = extractArrayField(item, ['tags', 'categories', 'labels']);
              
              return {
                id,
                name,
                email,
                age: findNumericValue(item, ['age', 'years', 'customer_age']),
                gender: findValue(item, ['gender', 'sex']),
                location: findValue(item, ['location', 'city', 'address', 'region', 'country']),
                registrationDate: findValue(item, ['registrationdate', 'registration date', 'registered']) || new Date().toISOString(),
                lastLoginDate: findValue(item, ['lastlogindate', 'last login date', 'last login']),
                preferences,
                tags
              };
            });
          
          console.log(`Processed ${customers.length} customer records from CSV`);
          
          if (customers.length === 0) {
            setImportStatus({
              message: "No customer records could be processed from the CSV file.",
              isError: true
            });
            return;
          }
          
          // Provide information about what fields were detected
          setImportStatus({
            message: `Processing ${customers.length} customer records. ` + 
                    `Name field: ${nameField || 'Not detected'}, Email field: ${emailField || 'Not detected'}`,
            isError: false
          });
          setImportProgress(50);
          
          // Continue with the upload process
          const batchSize = 100;
          const totalBatches = Math.ceil(customers.length / batchSize);
          let batchesProcessed = 0;
          
          const processBatch = async (batch: any[]) => {
            try {
              setImportStatus({
                message: `Uploading batch ${batchesProcessed + 1}/${totalBatches} (${batch.length} customers)...`,
                isError: false
              });
              
              console.log(`Uploading batch ${batchesProcessed + 1}/${totalBatches} with ${batch.length} customers`);
              
              const response = await fetchApi('/api/recommendation/customers', {
                method: 'POST',
                body: JSON.stringify(batch),
                headers: { 'Content-Type': 'application/json' }
              });
              
              console.log(`Batch ${batchesProcessed + 1} upload response:`, response);
              
              batchesProcessed++;
              setImportProgress(50 + (50 * batchesProcessed / totalBatches));
              
              if (batchesProcessed < totalBatches) {
                const nextBatch = customers.slice(
                  batchesProcessed * batchSize,
                  (batchesProcessed + 1) * batchSize
                );
                await processBatch(nextBatch);
              } else {
                // All batches processed
                setImportStatus({
                  message: `Successfully imported ${customers.length} customers`,
                  isError: false
                });
                
                // Refresh the customer list
                try {
                  const data = await fetchApi('/api/recommendation/customers');
                  setCustomers(Array.isArray(data) ? data : []);
                } catch (error) {
                  console.error('Error refreshing customer list:', error);
                }
                
                // Reset file input
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }
            } catch (error) {
              console.error('Error uploading customer batch:', error);
              setImportStatus({
                message: `Failed to import customers. Error: ${error instanceof Error ? error.message : String(error)}`,
                isError: true
              });
            }
          };
          
          // Start processing the first batch
          const firstBatch = customers.slice(0, batchSize);
          processBatch(firstBatch);
        },
        error: (error) => {
          console.error("Error parsing CSV:", error);
          setImportStatus({
            message: `Failed to parse CSV: ${error.message}`,
            isError: true
          });
        }
      });
    }
  };

  // Helper functions to find values and extract data from different field names
  const findValue = (item: any, possibleFields: string[]): string => {
    for (const field of possibleFields) {
      if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
        return String(item[field]);
      }
    }
    return '';
  };

  const findNumericValue = (item: any, possibleFields: string[]): number => {
    for (const field of possibleFields) {
      if (item[field] !== undefined && item[field] !== null) {
        const value = Number(item[field]);
        if (!isNaN(value)) {
          return value;
        }
      }
    }
    return 0;
  };

  const extractArrayField = (item: any, possibleFields: string[]): string[] => {
    for (const field of possibleFields) {
      if (item[field] !== undefined && item[field] !== null) {
        if (typeof item[field] === 'string') {
          return item[field].split(',').map((t: string) => t.trim());
        } else if (Array.isArray(item[field])) {
          return item[field];
        }
      }
    }
    return [];
  };

  return (
    <div className="customer-data-upload">
      <h3>Customer Data Import</h3>
      <p className="section-description">
        Upload customer data for the recommendation system.
      </p>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="import-section">
        <h4>Import Customer Data</h4>
        <p>Upload a CSV file with customer information</p>
        <div className="csv-template-info">
          <h5>CSV Format Requirements:</h5>
          <p>Your CSV should include these columns:</p>
          <ul>
            <li><strong>id</strong> (optional): Unique customer ID</li>
            <li><strong>name</strong>: Customer's full name</li>
            <li><strong>email</strong>: Customer's email address</li>
            <li><strong>age</strong> (optional): Customer's age</li>
            <li><strong>gender</strong> (optional): Customer's gender</li>
            <li><strong>location</strong> (optional): Customer's location</li>
            <li><strong>registrationDate</strong> (optional): When the customer registered</li>
            <li><strong>lastLoginDate</strong> (optional): Customer's last login</li>
            <li><strong>preferences</strong> (optional): Comma-separated list of preferences</li>
            <li><strong>tags</strong> (optional): Comma-separated list of tags</li>
          </ul>
        </div>
        <input 
          type="file" 
          accept=".csv" 
          ref={fileInputRef}
          onChange={handleFileUpload} 
          style={{ display: 'none' }}
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="upload-button"
        >
          Select Customer CSV File
        </button>
        {importStatus.isError && 
          <div className="error-message">{importStatus.message}</div>
        }
        {!importStatus.isError && importStatus.message && (
          <div className="success-message">{importStatus.message}</div>
        )}
        {importProgress > 0 && importProgress < 100 && (
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${importProgress}%` }}
            ></div>
          </div>
        )}
      </div>

      {/* Sample CSV Template Download */}
      <div className="template-download">
        <h4>Need a sample template?</h4>
        <p>Download our CSV template to get started</p>
        <button 
          className="download-button"
          onClick={() => {
            const header = "id,name,email,age,gender,location,registrationDate,lastLoginDate,preferences,tags";
            const sample1 = "cust-001,John Doe,john@example.com,32,male,New York,2023-01-15T10:30:00Z,2023-05-20T14:22:10Z,\"electronics,outdoors,books\",\"loyal,premium\"";
            const sample2 = "cust-002,Jane Smith,jane@example.com,28,female,Los Angeles,2023-02-10T08:45:30Z,2023-05-18T09:15:45Z,\"fashion,beauty,fitness\",\"new,mobile\"";
            
            const csvContent = `${header}\n${sample1}\n${sample2}`;
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', 'customer_template.csv');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }}
        >
          Download Template
        </button>
      </div>
      
      {/* Customer List Data Table */}
      {isLoading ? (
        <div className="loading-indicator">Loading customer data...</div>
      ) : customers.length > 0 ? (
        <div className="customer-table">
          <h4>Imported Customers ({customers.length})</h4>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Location</th>
                <th>Registration Date</th>
                <th>Preferences</th>
              </tr>
            </thead>
            <tbody>
              {customers.slice(0, 10).map(customer => (
                <tr key={customer.id}>
                  <td>{customer.id}</td>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.location || 'N/A'}</td>
                  <td>{new Date(customer.registrationDate).toLocaleDateString()}</td>
                  <td>{customer.preferences?.join(', ') || 'None'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {customers.length > 10 && (
            <div className="table-footer">
              Showing 10 of {customers.length} customers
            </div>
          )}
        </div>
      ) : (
        <div className="no-data-message">
          No customer data available. Upload a CSV file to get started.
        </div>
      )}
      
      <style>{`
        .progress-bar-container {
          width: 100%;
          height: 8px;
          background-color: #e0e0e0;
          border-radius: 4px;
          margin-top: 8px;
          overflow: hidden;
        }
        
        .progress-bar-fill {
          height: 100%;
          background-color: #4caf50;
          transition: width 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default CustomerDataUpload; 