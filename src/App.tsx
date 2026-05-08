import { AppRouter } from './router';
import './App.css';

// Thin shell kept as a testing seam — import AppRouter directly in unit tests.
function App() {
  return <AppRouter />;
}

export default App;
