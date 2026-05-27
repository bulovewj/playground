import { render, screen } from '@testing-library/react';
import App from './App';

test('renders playground accessibility map title', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { name: /놀이터 접근성 지도/i })).toBeInTheDocument();
});
