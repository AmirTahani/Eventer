export const faqs = [
  {
    question: 'How do guests get in?',
    answer:
      'Someone who can invite sends a Telegram link. There is no public signup. If you were not invited, Eventer stays closed.',
  },
  {
    question: 'Can someone share the link and walk in?',
    answer:
      'A forward is not an invitation. Access is tied to Telegram ID. The person who was invited is the person who can register.',
  },
  {
    question: 'When is the address shown?',
    answer:
      'The venue stays hidden until the host releases it. Confirmed guests then see it in Telegram. It is not listed on the open web.',
  },
  {
    question: 'Is there a public event page?',
    answer:
      'No. Eventer does not publish a directory, a discover feed, or guest lists. Search engines are not given event pages to index.',
  },
  {
    question: 'Where do guests pay and get tickets?',
    answer:
      'Checkout happens in Telegram. A pending payment holds the seat. The ticket is issued only after payment confirms, then checked at the door with a QR code.',
  },
  {
    question: 'Who is the web console for?',
    answer:
      'Hosts. Create events, issue invitations, release the location, and check guests in. Guests never need a separate app.',
  },
] as const;

export const howItWorksSteps = [
  {
    title: 'Invite',
    body: 'A trusted person sends a Telegram link. There is no signup form on this site.',
  },
  {
    title: 'Register',
    body: 'Guests pick their party, pay if the event requires it, and get a ticket in chat. A pending payment holds the seat.',
  },
  {
    title: 'Arrive',
    body: 'Hosts check in at the door. The address stays hidden until they release it to confirmed guests.',
  },
] as const;

export const audiences = [
  {
    title: 'Private nights',
    body: 'Warehouse parties and rooms where the list is the product, not the listing.',
  },
  {
    title: "Members' clubs",
    body: 'Recurring nights for people already in the room — not a public RSVP page.',
  },
  {
    title: 'Invite dinners',
    body: 'Supper clubs and seated events where a forwarded Eventbrite link would wreck the table.',
  },
] as const;

export const privacyPoints = [
  {
    title: 'A link is not an invite',
    body: 'Unlisted Eventbrite and Luma pages still let anyone with the URL register. Eventer ties access to Telegram ID.',
  },
  {
    title: 'The address is not public',
    body: 'Confirmed guests see the venue when you release it. Everyone else does not — including this website.',
  },
  {
    title: 'Capacity does not double-book',
    body: 'A pending payment holds the seat. When someone drops, the waitlist moves up on its own.',
  },
] as const;
