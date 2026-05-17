export const roles = ['Customer', 'Seller', 'Builder', 'Advertiser']

export const properties = [
  {
    id: 1,
    title: '3 BHK in Whitefield',
    price: 'Rs 1.45 Cr',
    meta: '1,820 sqft',
    tag: 'New',
    image:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 2,
    title: '3 BHK in Indiranagar',
    price: 'Rs 1.62 Cr',
    meta: '1,940 sqft',
    tag: 'Ready',
    image:
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 3,
    title: '2 BHK in Sarjapur',
    price: 'Rs 92 L',
    meta: '1,210 sqft',
    tag: 'New',
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 4,
    title: 'Villa in Marathahalli',
    price: 'Rs 2.25 Cr',
    meta: '2,600 sqft',
    tag: 'Villa',
    image:
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=900&q=80',
  },
]

export const bookings = [
  {
    id: 'BK-2841',
    status: 'Rider en route',
    tone: 'success',
    rider: 'Suresh K.',
    eta: 'KA-01 BX 2841',
    cta: 'Track',
  },
  {
    id: 'BK-2842',
    status: 'Finding rider...',
    tone: 'warn',
    rider: 'Looking for nearby rider...',
    eta: 'Avg pickup: 8 min',
    cta: 'Track',
  },
  {
    id: 'BK-2843',
    status: 'Completed',
    tone: 'muted',
    rider: 'Suresh K.',
    eta: 'KA-01 BX 2841',
    cta: 'View',
  },
  {
    id: 'BK-2844',
    status: 'Completed',
    tone: 'muted',
    rider: 'Suresh K.',
    eta: 'KA-01 BX 2841',
    cta: 'View',
  },
]

export const paymentStatuses = [
  'Success',
  'Pending',
  'Failed',
  'Success',
  'Success',
  'Success',
]

export const notifications = [
  { type: 'car', title: 'Rider Suresh is 3 min away', time: 'just now' },
  { type: 'pay', title: 'Payment Rs 670 received', time: '3 m' },
  { type: 'home', title: 'New property near you: 3 BHK Indiranagar', time: '2 h' },
  { type: 'warn', title: 'ApnaGhr - we updated our privacy policy', time: 'yesterday' },
  { type: 'car', title: 'Rider Suresh is 3 min away', time: '2 d' },
  { type: 'pay', title: 'Payment Rs 670 received', time: '3 d' },
]

export const legalItems = [
  'Terms of service',
  'Privacy policy',
  'Refund policy',
  'Rider conduct',
]
