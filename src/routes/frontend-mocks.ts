import express from 'express';
import path from 'path';

const router = express.Router();

// Simple HTML template function
const createHtmlTemplate = (title: string, content: string) => `
<!DOCTYPE html>
<html>
<head>
  <title>${title} - Gromo</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #333; }
    .card { border: 1px solid #ddd; border-radius: 4px; padding: 15px; margin-bottom: 20px; }
    button { background: #0066cc; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
    button:hover { background: #0055aa; }
    input, select, textarea { width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    [data-cy] { outline: 1px dashed rgba(0,0,255,0.2); } /* Highlight data-cy elements for debugging */
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <div class="content">
      ${content}
    </div>
  </div>
</body>
</html>
`;

// Mock routes for Cypress testing

// Voice processing page
router.get('/voice', (req, res) => {
  const content = `
    <div class="card">
      <h2>Voice Processing</h2>
      <p>Upload an audio file to process voice data</p>
      
      <div>
        <input type="file" data-cy="voice-upload" accept="audio/*" />
        <button data-cy="process-audio">Process Audio</button>
      </div>
      
      <div class="results" style="margin-top: 20px;">
        <h3>Results</h3>
        <div data-cy="transcript-result">I need help with my insurance claim</div>
        
        <div data-cy="confidence-score">Confidence: 95%</div>
        
        <div data-cy="claim-type">
          <strong>Claim Type:</strong> general
        </div>
        
        <div data-cy="entities-section">
          <h4>Extracted Entities</h4>
          <ul>
            <li>No specific entities found</li>
          </ul>
        </div>
      </div>
    </div>
  `;
  
  res.send(createHtmlTemplate('Voice Processing', content));
});

// Claims dashboard
router.get('/claims', (req, res) => {
  const content = `
    <div data-cy="claims-dashboard">
      <div class="card">
        <h2>Claims Dashboard</h2>
        
        <div data-cy="dashboard-analytics">
          <div class="stats-container">
            <div class="stat-card">
              <h3>Open Claims</h3>
              <p>12</p>
            </div>
            <div class="stat-card">
              <h3>Approved Claims</h3>
              <p>45</p>
            </div>
            <div class="stat-card">
              <h3>Rejected Claims</h3>
              <p>8</p>
            </div>
          </div>
        </div>
        
        <div>
          <input type="text" data-cy="claim-search" placeholder="Search claims..." />
          <select data-cy="status-filter">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        
        <table data-cy="claims-table">
          <thead>
            <tr>
              <th>Claim #</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr data-cy="claim-row" data-claim-id="CLM001">
              <td>CLM001</td>
              <td>Medical</td>
              <td>$5,000</td>
              <td>Pending</td>
              <td><button data-cy="view-claim">View</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <button data-cy="new-claim-button">New Claim</button>
    
    <div data-cy="claim-form" style="display:none;">
      <div class="card">
        <h2>New Claim</h2>
        <form>
          <div>
            <label>Claim Type</label>
            <select data-cy="claim-type-input" required>
              <option value="">Select Type</option>
              <option value="medical">Medical</option>
              <option value="vehicle">Vehicle</option>
              <option value="property">Property</option>
            </select>
          </div>
          
          <div>
            <label>Policy Number</label>
            <input type="text" data-cy="policy-number-input" required />
          </div>
          
          <div>
            <label>Description</label>
            <textarea data-cy="claim-description-input" required></textarea>
          </div>
          
          <div>
            <label>Amount</label>
            <input type="number" data-cy="claim-amount-input" required />
          </div>
          
          <div>
            <label>Supporting Documents</label>
            <input type="file" data-cy="claim-documents-input" multiple />
          </div>
          
          <button type="submit" data-cy="submit-claim">Submit Claim</button>
        </form>
      </div>
    </div>
    
    <div data-cy="claim-details" style="display:none;">
      <div class="card">
        <h2>Claim Details: <span data-cy="claim-number">CLM001</span></h2>
        
        <div>
          <strong>Status:</strong> <span data-cy="claim-status">Pending</span>
        </div>
        
        <div>
          <label>Update Status:</label>
          <select data-cy="status-update">
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <div data-cy="approval-section">
            <label>Settlement Amount:</label>
            <input type="number" data-cy="settlement-amount" />
          </div>
          
          <div data-cy="rejection-section">
            <label>Rejection Reason:</label>
            <textarea data-cy="rejection-reason"></textarea>
          </div>
          
          <button data-cy="update-status-button">Update Status</button>
        </div>
      </div>
    </div>
  `;
  
  res.send(createHtmlTemplate('Claims Dashboard', content));
});

export default router;