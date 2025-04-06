import React, { useState, useEffect, useRef, useMemo } from 'react';
import { fetchApi } from '../../utils/api';
import './ProductCatalog.css';
import Papa from 'papaparse';

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
  inventory?: number;
  popularity?: number;
  tags?: string[];
  imageUrl?: string;
}

const ProductCatalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{ message: string; isError: boolean }>({ message: '', isError: false });
  const [importProgress, setImportProgress] = useState<number>(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Derive categories from products
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map(p => p.category)));
    return ['all', ...uniqueCategories];
  }, [products]);
  
  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter(product => {
        // Filter by search term
        const matchesSearch = 
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
          product.imageUrl?.toLowerCase().includes(searchTerm.toLowerCase());
          
        // Filter by category
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'price_asc':
            return a.price - b.price;
          case 'price_desc':
            return b.price - a.price;
          case 'popularity':
            return (b.popularity || 0) - (a.popularity || 0);
          case 'inventory':
            return (b.inventory || 0) - (a.inventory || 0);
          default:
            return a.name.localeCompare(b.name);
        }
      });
  }, [products, searchTerm, selectedCategory, sortBy]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await fetchApi('/api/recommendation/products');
      setProducts(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(`Failed to load products: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProducts();
  }, []);
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportStatus({ message: "Processing product CSV...", isError: false });
    setImportProgress(0);
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: (header: string) => header.trim().toLowerCase(),
        complete: (results) => {
          console.log("Product CSV parsing complete", results);
          
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
          const nameFields = ['name', 'product name', 'productname', 'title', 'product', 'item', 'item name'];
          const priceFields = ['price', 'cost', 'amount', 'value', 'unit price', 'unitprice'];
          const categoryFields = ['category', 'department', 'type', 'group', 'class'];
          
          // Find the best field matches
          const nameField = nameFields.find(field => availableFields.includes(field));
          const priceField = priceFields.find(field => availableFields.includes(field));
          const categoryField = categoryFields.find(field => availableFields.includes(field));
          
          console.log(`Identified key fields - Name: ${nameField}, Price: ${priceField}, Category: ${categoryField}`);
          
          // Process all rows, extracting what data we can
          const products = results.data
            .filter((row: any) => row && typeof row === 'object')
            .map((item: any, index: number) => {
              // Generate ID if not present
              const id = findValue(item, ['id', 'productid', 'product_id', 'sku', 'item id', 'itemid']) || 
                        `prod-${Date.now()}-${index}`;
              
              // Extract name or generate a default
              const name = findValue(item, nameFields) || `Product ${index + 1}`;
              
              // Get price or default to 0
              const price = findNumericValue(item, priceFields);
              
              // Other fields with fallbacks
              const description = findValue(item, ['description', 'desc', 'summary', 'details', 'product description']);
              const category = findValue(item, categoryFields);
              const inventory = findNumericValue(item, ['inventory', 'stock', 'quantity', 'on hand', 'stock level']);
              const popularity = findNumericValue(item, ['popularity', 'rating', 'rank', 'score', 'stars']);
              const tags = extractArrayField(item, ['tags', 'keywords', 'categories', 'labels']);
              const imageUrl = findValue(item, ['imageurl', 'image', 'image url', 'img', 'src', 'picture', 'photo']);
              
              return {
                id,
                name,
                price,
                description,
                category,
                inventory,
                popularity,
                tags,
                imageUrl
              };
            });
          
          console.log(`Processed ${products.length} product records from CSV`);
          
          if (products.length === 0) {
            setImportStatus({
              message: "No product records could be processed from the CSV file.",
              isError: true
            });
            return;
          }
          
          // Provide information about what fields were detected
          setImportStatus({
            message: `Processing ${products.length} product records. ` + 
                    `Name: ${nameField || 'Not detected'}, Price: ${priceField || 'Not detected'}, Category: ${categoryField || 'Not detected'}`,
            isError: false
          });
          setImportProgress(50);
          
          // Upload products to API
          const uploadProducts = async () => {
            try {
              setImportStatus({
                message: `Uploading ${products.length} products...`,
                isError: false
              });
              
              console.log(`Uploading ${products.length} products to API`);
              
              const response = await fetchApi('/api/recommendation/products', {
                method: 'POST',
                body: JSON.stringify(products),
                headers: { 'Content-Type': 'application/json' }
              });
              
              console.log('Product upload response:', response);
              
              if (response && response.success) {
                setImportStatus({
                  message: `Successfully imported ${response.importedCount || products.length} products`,
                  isError: false
                });
                
                // Refresh product list
                fetchProducts();
                
                // Reset file input
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
                
                setImportProgress(100);
                setTimeout(() => setImportProgress(0), 3000);
              } else {
                throw new Error(response.message || 'Unknown error during product import');
              }
            } catch (error) {
              console.error('Error uploading products:', error);
              setImportStatus({
                message: `Failed to import products. Error: ${error instanceof Error ? error.message : String(error)}`,
                isError: true
              });
              setImportProgress(0);
            }
          };
          
          uploadProducts();
        },
        error: (error) => {
          console.error("Error parsing product CSV:", error);
          setImportStatus({
            message: `Failed to parse CSV: ${error.message}`,
            isError: true
          });
          setImportProgress(0);
        }
      });
    }
  };

  // Helper functions to extract data from different field names
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
    <div className="product-catalog">
      <h3>Product Catalog</h3>
      <p className="section-description">
        Manage products that will be used by the recommendation system.
      </p>
      
      <div className="import-section">
        <h4>Import Products</h4>
        <p>Upload a CSV file with your product information</p>
        <div className="csv-template-info">
          <h5>CSV Format Requirements:</h5>
          <p>Your CSV should include these columns:</p>
          <ul>
            <li><strong>id</strong> (optional): Unique product ID</li>
            <li><strong>name</strong>: Product name</li>
            <li><strong>price</strong>: Product price (numeric)</li>
            <li><strong>description</strong> (optional): Product description</li>
            <li><strong>category</strong>: Main product category</li>
            <li><strong>subcategory</strong>: Product subcategory</li>
            <li><strong>imageUrl</strong> (optional): URL to product image</li>
            <li><strong>inventory</strong>: Available inventory (numeric)</li>
            <li><strong>popularity</strong> (optional): Product popularity score (numeric)</li>
            <li><strong>attributes</strong> (optional): JSON string of product attributes</li>
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
          className="btn primary" 
          onClick={() => fileInputRef.current?.click()}
        >
          Select Product CSV File
        </button>
        {importStatus.isError && 
          <div className="error-message">{importStatus.message}</div>
        }
        {!importStatus.isError && importStatus.message && (
          <div className="success-message">{importStatus.message}</div>
        )}
        {importProgress > 0 && (
          <div className="progress-bar-container">
            <div 
              className="progress-bar" 
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
          className="btn secondary"
          onClick={() => {
            const header = "id,name,price,description,category,subcategory,imageUrl,inventory,popularity,attributes";
            const sample1 = "prod-001,Premium Headphones,129.99,\"Noise cancelling over-ear headphones\",Electronics,Audio,https://example.com/headphones.jpg,45,4.7,\"{\"\"color\"\":\"\"black\"\",\"\"wireless\"\":true}\"";
            const sample2 = "prod-002,Running Shoes,89.95,\"Lightweight running shoes with cushioned sole\",Fashion,Footwear,https://example.com/shoes.jpg,78,4.2,\"{\"\"size\"\":\"\"medium\"\",\"\"color\"\":\"\"blue\"\"}\"";
            
            const csvContent = `${header}\n${sample1}\n${sample2}`;
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', 'product_template.csv');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }}
        >
          Download Template
        </button>
      </div>
      
      {isLoading ? (
        <div className="loading-indicator">Loading products...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <p>No products available. Import products using the form above.</p>
        </div>
      ) : (
        <div className="products-display">
          <div className="filters-bar">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="filter-selects">
              <div className="filter-group">
                <label>Category:</label>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label>Sort by:</label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="price_asc">Price (Low to High)</option>
                  <option value="price_desc">Price (High to Low)</option>
                  <option value="popularity">Popularity</option>
                  <option value="inventory">Inventory</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="product-results-info">
            Showing {filteredProducts.length} of {products.length} products
          </div>
          
          <div className="products-grid">
            {filteredProducts.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} />
                  ) : (
                    <div className="placeholder-image">
                      <span>{product.name.charAt(0)}{product.category?.charAt(0)}</span>
                    </div>
                  )}
                </div>
                
                <div className="product-info">
                  <h4 className="product-name">{product.name}</h4>
                  <div className="product-category">
                    <span className="category-tag">{product.category}</span>
                  </div>
                  <p className="product-price">${product.price.toFixed(2)}</p>
                  
                  {product.description && (
                    <p className="product-description">{product.description}</p>
                  )}
                  
                  <div className="product-meta">
                    <div className="meta-item inventory">
                      <span className="label">Stock:</span>
                      <span className={`value ${(product.inventory || 0) < 10 ? 'low' : (product.inventory || 0) > 50 ? 'high' : 'medium'}`}>
                        {product.inventory || 0}
                      </span>
                    </div>
                    
                    {product.popularity !== undefined && (
                      <div className="meta-item popularity">
                        <span className="label">Popularity:</span>
                        <span className="value">
                          {product.popularity.toFixed(1)}
                          <div className="popularity-stars">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span 
                                key={i} 
                                className={`star ${i < Math.round(product.popularity || 0) ? 'filled' : 'empty'}`}
                              >★</span>
                            ))}
                          </div>
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {product.tags && product.tags.length > 0 && (
                    <div className="product-tags">
                      <span className="label">Tags:</span>
                      <span className="tag-list">
                        {product.tags.map((tag, index) => (
                          <span key={`${product.id}-tag-${index}`} className="tag">{tag}</span>
                        ))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCatalog; 