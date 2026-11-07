import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { startSync } from './sync/sync';
import './styles/global.css';
import './styles/fandom.css';

const mount = document.getElementById('root')! as HTMLElement & { hipdokRoot?: ReturnType<typeof createRoot> };
(mount.hipdokRoot ??= createRoot(mount)).render(<App />);
startSync();
