import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PeoplePage from './pages/PeoplePage';
import PersonDetail from './pages/PersonDetail';
import PayersPage from './pages/PayersPage';
import CustomersPage from './pages/CustomersPage';
import AgentPage from './pages/AgentPage';
import Analytics from './pages/Analytics';
import LandingPage from './pages/LandingPage';

export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/landing" element={<LandingPage />} />

        {/* Operational Platform Shell */}
        <Route element={<Layout/>}>
          <Route path="/" element={<Dashboard/>}/>
          <Route path="/buyers" element={<PeoplePage stage="BUYER"/>}/>
          <Route path="/buyers/:id" element={<PersonDetail/>}/>
          <Route path="/leads" element={<PeoplePage stage="LEAD"/>}/>
          <Route path="/leads/:id" element={<PersonDetail/>}/>
          <Route path="/negotiation-profile" element={<PersonDetail defaultToLead={true}/>}/>
          <Route path="/negotiation-profile/:id" element={<PersonDetail/>}/>
          <Route path="/payers" element={<PayersPage/>}/>
          <Route path="/payers/:id" element={<PersonDetail/>}/>
          <Route path="/customers" element={<CustomersPage/>}/>
          <Route path="/customers/:id" element={<PersonDetail/>}/>
          
          {/* Agent Routes */}
          <Route path="/agents" element={<AgentPage type="ALL"/>}/>
          <Route path="/agents/marketing" element={<AgentPage type="MARKETING"/>}/>
          <Route path="/agents/negotiation" element={<AgentPage type="NEGOTIATION"/>}/>
          <Route path="/agents/processing" element={<AgentPage type="PROCESSING"/>}/>
          <Route path="/agents/loyalty" element={<AgentPage type="LOYALTY"/>}/>
          
          <Route path="/analytics" element={<Analytics/>}/>
          <Route path="*" element={<Navigate to="/" replace/>}/>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
