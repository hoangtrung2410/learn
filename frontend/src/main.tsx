import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {AccessProvider} from './lib/access.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <AccessProvider>
    <App />
  </AccessProvider>,
);
