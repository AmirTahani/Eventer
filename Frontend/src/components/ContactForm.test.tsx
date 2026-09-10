import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactForm } from '@/components/ContactForm';

describe('ContactForm', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows Telegram bot link when username is set', () => {
    render(
      <ContactForm
        contactEmail="hello@eventer.world"
        botUsername="Eventer_advance_bot"
      />,
    );
    expect(
      screen.getByRole('link', { name: /open @eventer_advance_bot/i }),
    ).toHaveAttribute('href', 'https://t.me/Eventer_advance_bot');
  });

  it('opens mailto with form fields', async () => {
    const user = userEvent.setup();
    const locationStub = { href: '' };
    vi.stubGlobal('location', locationStub);

    render(
      <ContactForm contactEmail="hello@eventer.world" botUsername={null} />,
    );
    await user.type(screen.getByRole('textbox', { name: /^name/i }), 'Alex');
    await user.type(
      screen.getByRole('textbox', { name: /^email/i }),
      'alex@example.com',
    );
    await user.type(
      screen.getByRole('textbox', { name: /^message/i }),
      'Hosting a private night',
    );
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(locationStub.href).toMatch(
      /^mailto:hello@eventer\.world\?subject=.*&body=.*/,
    );
    expect(decodeURIComponent(locationStub.href)).toContain('Alex');
    expect(decodeURIComponent(locationStub.href)).toContain(
      'Hosting a private night',
    );
  });
});
