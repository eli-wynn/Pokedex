import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the Pokedex without crashing', () => {
  render(<App />);
  // Home starts in its loading state synchronously, before the Pokemon
  // list fetch (unmocked here) resolves.
  expect(screen.getByText(/Loading Pokédex/i)).toBeInTheDocument();
});
