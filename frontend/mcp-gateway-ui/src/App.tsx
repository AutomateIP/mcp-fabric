/**
 * Main App component with routing
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Servers from './pages/Servers';
import CreateServerQuick from './pages/CreateServerQuick';
import CreateServerAdvanced from './pages/CreateServerAdvanced';
import Instances from './pages/Instances';
import CreateInstance from './pages/CreateInstance';
import Tools from './pages/Tools';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="servers" element={<Servers />} />
          <Route path="servers/create/quick" element={<CreateServerQuick />} />
          <Route path="servers/create/advanced" element={<CreateServerAdvanced />} />
          <Route path="instances" element={<Instances />} />
          <Route path="instances/create" element={<CreateInstance />} />
          <Route path="tools" element={<Tools />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
