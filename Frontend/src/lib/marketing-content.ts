export const hero = {
  headline: 'Stay closed until you open the door.',
  subhead:
    'Invite-only events. Guests register in Telegram. You run the night from the web.',
  note: 'No public signup. Guests need an invitation.',
} as const;

export const guestSection = {
  title: "You're invited in Telegram.",
  points: [
    'Register and pay in chat — no extra app.',
    'A pending payment holds your seat.',
    'The address arrives only after you are confirmed.',
  ],
  cta: 'Join an event',
} as const;

export const organizerSection = {
  title: 'You run the door from the web.',
  points: [
    'Control the list, capacity, and waitlist.',
    'Release the address when you are ready.',
    'Check guests in with an audit trail.',
  ],
  cta: 'Organize an event',
} as const;

export const twoSurfaces = {
  title: 'Two surfaces. One closed room.',
  body: 'Guests stay in Telegram. Hosts get the console — capacity, waitlist, location, and check-in.',
} as const;

export const howItWorksSteps = [
  {
    title: 'Invite',
    body: 'Someone trusted sends a Telegram link. There is no signup form here.',
  },
  {
    title: 'Register',
    body: 'Pick seats, pay if needed, get a ticket in chat. Pending payment holds capacity.',
  },
  {
    title: 'Arrive',
    body: 'Check-in at the door. The address stays hidden until the host releases it.',
  },
] as const;

export const audiences = [
  {
    title: 'Private nights',
    body: 'Warehouses and afters where the list is the product, not a listing.',
  },
  {
    title: "Members' clubs",
    body: 'Recurring nights for people already in — not a public RSVP page.',
  },
  {
    title: 'Invite dinners',
    body: 'Seated rooms where a forwarded Eventbrite link would wreck the table.',
  },
] as const;

export const privacyPoints = [
  {
    title: 'A link is not an invite',
    body: 'Access is tied to Telegram ID, not a shareable URL.',
  },
  {
    title: 'The address is not public',
    body: 'Confirmed guests see it when you release it. Everyone else does not.',
  },
  {
    title: 'Capacity does not double-book',
    body: 'Pending payments hold seats. The waitlist moves when someone drops.',
  },
] as const;

export const trustIntro = {
  title: 'An unlisted link is not private',
  body: 'Anyone who forwards an Eventbrite or Luma URL can register. Eventer does not work that way.',
} as const;

export const securitySection = {
  title: 'Content stays closed. Paths stay encrypted.',
  body: "Eventer is built so guest lists, tickets, and venue details never sit on a public page. Guest traffic moves through Telegram's encrypted channel; the host console is served over HTTPS.",
  points: [
    {
      title: 'Encrypted guest channel',
      body: 'Invites, registration, payment status, and tickets travel in Telegram — an encrypted chat path guests already trust. Nothing is published as an open web listing.',
    },
    {
      title: 'Encrypted host console',
      body: 'Organizers sign in over HTTPS. Session traffic to the console is encrypted in transit. Privileged actions leave an audit trail instead of a public feed.',
    },
    {
      title: 'Access-gated content',
      body: 'Event details, capacity, waitlists, and addresses are visible only to invited guests and authorized hosts. Search engines do not get event pages to index.',
    },
    {
      title: 'End-to-end closed room',
      body: 'From invite to check-in, sensitive content stays inside authenticated channels — Telegram for guests, the encrypted console for hosts — not on a shareable public RSVP page.',
    },
  ],
} as const;

export const faqs = [
  {
    question: 'How do guests get in?',
    answer:
      'A trusted person sends a Telegram invite. There is no public signup. Without an invitation, Eventer stays closed.',
  },
  {
    question: 'Can someone share the link and walk in?',
    answer:
      'No. A forward is not an invitation. Access is tied to Telegram ID — only the invited person can register.',
  },
  {
    question: 'When is the address shown?',
    answer:
      'When the host releases it. Confirmed guests see it in Telegram. It is never listed on the open web.',
  },
  {
    question: 'Is there a public event page?',
    answer:
      'No. No directory, discover feed, or public guest list. Search engines do not get event pages to index.',
  },
  {
    question: 'Where do guests pay and get tickets?',
    answer:
      'In Telegram. A pending payment holds the seat. The ticket issues after payment confirms, then checks in with a QR code.',
  },
  {
    question: 'How is content secured?',
    answer:
      "Guest invites, tickets, and messages stay in Telegram's encrypted channel. The host console runs over HTTPS. Event lists and addresses are access-gated — never published as public pages.",
  },
  {
    question: 'Who is the web console for?',
    answer:
      'Hosts. Create events, invite guests, release the location, and check people in. Guests never need another app.',
  },
] as const;
