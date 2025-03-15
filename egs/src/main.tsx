import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './css/style.css';
import './css/satoshi.css';
import 'jsvectormap/dist/css/jsvectormap.css';
import 'flatpickr/dist/flatpickr.min.css';
import { Toaster } from 'react-hot-toast';
import { CampaignProvider } from './context/CampaignContext';
import { RefreshProvider } from './context/RefreshContext';
import { TooltipProvider } from './components/ui/tooltip';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Router>
      <RefreshProvider>
        <CampaignProvider>
          <TooltipProvider>
            <App />
            <Toaster />
          </TooltipProvider>
        </CampaignProvider>
      </RefreshProvider>
    </Router>
  </React.StrictMode>,
);
