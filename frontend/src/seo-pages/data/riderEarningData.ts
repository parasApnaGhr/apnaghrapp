// @ts-nocheck
// Rider Earning Data - Static content for SEO landing pages
// Informational only - no connection to core transaction logic

export const EARNING_STATS = {
  averagePerVisit: 150,
  averageVisitsPerDay: 8,
  maxEarningsPerDay: 2500,
  minEarningsPerDay: 800,
  averageEarningsPerDay: 1500,
  monthlyPotential: 45000,
  topEarnerMonthly: 75000,
  totalRiders: 12000,
  citiesActive: 60,
  propertiesListed: 50000,
};

export const EARNING_TIERS = [
  {
    tier: 'Starter',
    visitsPerDay: '3-5',
    dailyEarnings: '₹450 - ₹750',
    monthlyEarnings: '₹12,000 - ₹20,000',
    ideal: 'Part-time, Students, Side income',
    color: 'blue',
  },
  {
    tier: 'Regular',
    visitsPerDay: '6-10',
    dailyEarnings: '₹900 - ₹1,500',
    monthlyEarnings: '₹25,000 - ₹40,000',
    ideal: 'Full-time riders, Career changers',
    color: 'green',
  },
  {
    tier: 'Pro',
    visitsPerDay: '12-15',
    dailyEarnings: '₹1,800 - ₹2,500',
    monthlyEarnings: '₹50,000 - ₹75,000',
    ideal: 'Top performers, Team leaders',
    color: 'gold',
  },
];

export const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Register as Rider',
    description: 'Sign up with your phone number, upload documents, and complete verification in 24 hours.',
    icon: 'UserPlus',
  },
  {
    step: 2,
    title: 'Receive Visit Requests',
    description: 'Get notified when customers book property visits in your area. Accept visits that suit your schedule.',
    icon: 'Bell',
  },
  {
    step: 3,
    title: 'Accompany Customers',
    description: 'Meet the customer, guide them to properties, help with inspections, and ensure a smooth experience.',
    icon: 'MapPin',
  },
  {
    step: 4,
    title: 'Complete & Earn',
    description: 'Mark visit complete, get instant payment in your wallet, and withdraw anytime to your bank.',
    icon: 'Wallet',
  },
];

export const REQUIREMENTS = [
  { item: 'Smartphone with internet', required: true },
  { item: 'Two-wheeler (bike/scooter)', required: true },
  { item: 'Valid driving license', required: true },
  { item: 'Aadhaar Card', required: true },
  { item: 'PAN Card', required: false, note: 'For earnings above ₹50,000/year' },
  { item: 'Bank account', required: true },
  { item: 'Good communication skills', required: true },
  { item: 'Age 18-45 years', required: true },
];

export const RIDER_TESTIMONIALS = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    city: 'Mohali',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    rating: 5,
    earnings: '₹42,000/month',
    duration: '8 months',
    quote: 'I left my delivery job and joined ApnaGhr. The earnings are better, work is flexible, and I meet different people every day. Best decision I made!',
  },
  {
    id: 2,
    name: 'Priya Singh',
    city: 'Chandigarh',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    rating: 5,
    earnings: '₹28,000/month',
    duration: '4 months',
    quote: 'As a college student, this is perfect. I work on weekends and earn enough for my expenses. The app is easy to use and payments are always on time.',
  },
  {
    id: 3,
    name: 'Vikram Sharma',
    city: 'Zirakpur',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    rating: 5,
    earnings: '₹65,000/month',
    duration: '1 year',
    quote: 'Started as a part-timer, now I lead a team of 5 riders. ApnaGhr helped me build a real career in real estate. The growth opportunities are amazing.',
  },
  {
    id: 4,
    name: 'Amit Verma',
    city: 'Panchkula',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    rating: 4,
    earnings: '₹35,000/month',
    duration: '6 months',
    quote: 'After losing my job during COVID, this gave me a fresh start. Flexible hours, good income, and I\'m my own boss. Highly recommend to anyone looking for work.',
  },
  {
    id: 5,
    name: 'Sunita Devi',
    city: 'Kharar',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    rating: 5,
    earnings: '₹22,000/month',
    duration: '3 months',
    quote: 'Being a woman rider, I was initially hesitant. But ApnaGhr team is very supportive and customers are respectful. I feel safe and empowered.',
  },
];

export const RIDER_FAQS = [
  {
    question: 'How much can I earn as a Property Rider?',
    answer: 'Earnings depend on the number of visits you complete. On average, riders earn ₹150-200 per visit. Active riders completing 8-10 visits daily earn ₹1,200-2,000 per day, which translates to ₹35,000-60,000 monthly.',
  },
  {
    question: 'What are the working hours?',
    answer: 'You choose your own hours! Most property visits happen between 9 AM - 7 PM. You can accept or decline visits based on your availability. There\'s no minimum hours requirement.',
  },
  {
    question: 'Do I need prior experience in real estate?',
    answer: 'No experience needed! We provide complete training on property visits, customer handling, and using the app. Most riders become confident within their first week.',
  },
  {
    question: 'How do I receive payments?',
    answer: 'Earnings are credited to your in-app wallet instantly after completing a visit. You can withdraw to your bank account anytime - withdrawals are processed within 24 hours.',
  },
  {
    question: 'What documents are required to join?',
    answer: 'You need: Aadhaar Card, Valid Driving License, PAN Card (for earnings above ₹50,000/year), Bank Account details, and a smartphone with internet.',
  },
  {
    question: 'Is there any joining fee or deposit?',
    answer: 'No! Joining ApnaGhr as a rider is completely FREE. There are no hidden charges, deposits, or deductions. You keep 100% of your earnings.',
  },
  {
    question: 'What if a customer cancels the visit?',
    answer: 'If a customer cancels after you\'ve been assigned, you receive a cancellation compensation. We ensure riders are fairly compensated for their time.',
  },
  {
    question: 'Can I work in multiple cities?',
    answer: 'Yes! Once verified, you can accept visits in any city where ApnaGhr operates. This is great if you travel or want to explore different areas.',
  },
  {
    question: 'What support does ApnaGhr provide?',
    answer: 'We offer 24/7 support via app chat, phone helpline, and WhatsApp. Our rider success team helps with any issues, training, and growth opportunities.',
  },
  {
    question: 'Are there incentives and bonuses?',
    answer: 'Yes! We offer weekly bonuses for completing targets, referral bonuses for bringing new riders, and special incentives during peak seasons.',
  },
];

export const CITIES_FOR_RIDERS = [
  // Metro Cities
  { slug: 'delhi', name: 'Delhi', state: 'Delhi', activeRiders: 850, avgEarnings: '₹48,000' },
  { slug: 'mumbai', name: 'Mumbai', state: 'Maharashtra', activeRiders: 920, avgEarnings: '₹52,000' },
  { slug: 'bangalore', name: 'Bangalore', state: 'Karnataka', activeRiders: 780, avgEarnings: '₹50,000' },
  { slug: 'hyderabad', name: 'Hyderabad', state: 'Telangana', activeRiders: 620, avgEarnings: '₹46,000' },
  { slug: 'chennai', name: 'Chennai', state: 'Tamil Nadu', activeRiders: 540, avgEarnings: '₹44,000' },
  { slug: 'kolkata', name: 'Kolkata', state: 'West Bengal', activeRiders: 480, avgEarnings: '₹40,000' },
  { slug: 'pune', name: 'Pune', state: 'Maharashtra', activeRiders: 520, avgEarnings: '₹45,000' },
  { slug: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', activeRiders: 380, avgEarnings: '₹42,000' },
  // NCR Region
  { slug: 'noida', name: 'Noida', state: 'Uttar Pradesh', activeRiders: 420, avgEarnings: '₹46,000' },
  { slug: 'gurgaon', name: 'Gurgaon', state: 'Haryana', activeRiders: 480, avgEarnings: '₹48,000' },
  { slug: 'ghaziabad', name: 'Ghaziabad', state: 'Uttar Pradesh', activeRiders: 220, avgEarnings: '₹38,000' },
  { slug: 'faridabad', name: 'Faridabad', state: 'Haryana', activeRiders: 180, avgEarnings: '₹36,000' },
  // Gujarat
  { slug: 'surat', name: 'Surat', state: 'Gujarat', activeRiders: 280, avgEarnings: '₹40,000' },
  { slug: 'vadodara', name: 'Vadodara', state: 'Gujarat', activeRiders: 160, avgEarnings: '₹36,000' },
  { slug: 'rajkot', name: 'Rajkot', state: 'Gujarat', activeRiders: 120, avgEarnings: '₹34,000' },
  // Rajasthan
  { slug: 'jaipur', name: 'Jaipur', state: 'Rajasthan', activeRiders: 340, avgEarnings: '₹42,000' },
  { slug: 'ajmer', name: 'Ajmer', state: 'Rajasthan', activeRiders: 65, avgEarnings: '₹30,000' },
  { slug: 'alwar', name: 'Alwar', state: 'Rajasthan', activeRiders: 55, avgEarnings: '₹28,000' },
  // Uttar Pradesh
  { slug: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh', activeRiders: 260, avgEarnings: '₹38,000' },
  { slug: 'agra', name: 'Agra', state: 'Uttar Pradesh', activeRiders: 140, avgEarnings: '₹32,000' },
  { slug: 'kanpur', name: 'Kanpur', state: 'Uttar Pradesh', activeRiders: 180, avgEarnings: '₹34,000' },
  { slug: 'varanasi', name: 'Varanasi', state: 'Uttar Pradesh', activeRiders: 120, avgEarnings: '₹30,000' },
  { slug: 'meerut', name: 'Meerut', state: 'Uttar Pradesh', activeRiders: 95, avgEarnings: '₹32,000' },
  // Madhya Pradesh
  { slug: 'indore', name: 'Indore', state: 'Madhya Pradesh', activeRiders: 220, avgEarnings: '₹38,000' },
  { slug: 'bhopal', name: 'Bhopal', state: 'Madhya Pradesh', activeRiders: 180, avgEarnings: '₹36,000' },
  { slug: 'ujjain', name: 'Ujjain', state: 'Madhya Pradesh', activeRiders: 45, avgEarnings: '₹28,000' },
  { slug: 'gwalior', name: 'Gwalior', state: 'Madhya Pradesh', activeRiders: 75, avgEarnings: '₹30,000' },
  // Punjab & Chandigarh
  { slug: 'chandigarh', name: 'Chandigarh', state: 'Chandigarh', activeRiders: 120, avgEarnings: '₹42,000' },
  { slug: 'mohali', name: 'Mohali', state: 'Punjab', activeRiders: 85, avgEarnings: '₹38,000' },
  { slug: 'zirakpur', name: 'Zirakpur', state: 'Punjab', activeRiders: 65, avgEarnings: '₹36,000' },
  { slug: 'jalandhar', name: 'Jalandhar', state: 'Punjab', activeRiders: 55, avgEarnings: '₹34,000' },
  { slug: 'ludhiana', name: 'Ludhiana', state: 'Punjab', activeRiders: 75, avgEarnings: '₹40,000' },
  { slug: 'amritsar', name: 'Amritsar', state: 'Punjab', activeRiders: 60, avgEarnings: '₹33,000' },
  { slug: 'bathinda', name: 'Bathinda', state: 'Punjab', activeRiders: 30, avgEarnings: '₹28,000' },
  { slug: 'patiala', name: 'Patiala', state: 'Punjab', activeRiders: 40, avgEarnings: '₹30,000' },
  { slug: 'kharar', name: 'Kharar', state: 'Punjab', activeRiders: 35, avgEarnings: '₹32,000' },
  { slug: 'derabassi', name: 'Dera Bassi', state: 'Punjab', activeRiders: 25, avgEarnings: '₹29,000' },
  { slug: 'panchkula', name: 'Panchkula', state: 'Haryana', activeRiders: 45, avgEarnings: '₹35,000' },
  // Haryana
  { slug: 'hisar', name: 'Hisar', state: 'Haryana', activeRiders: 55, avgEarnings: '₹30,000' },
  { slug: 'rohtak', name: 'Rohtak', state: 'Haryana', activeRiders: 50, avgEarnings: '₹29,000' },
  { slug: 'panipat', name: 'Panipat', state: 'Haryana', activeRiders: 45, avgEarnings: '₹28,000' },
  { slug: 'karnal', name: 'Karnal', state: 'Haryana', activeRiders: 40, avgEarnings: '₹28,000' },
  { slug: 'ambala', name: 'Ambala', state: 'Haryana', activeRiders: 50, avgEarnings: '₹30,000' },
  // Uttarakhand
  { slug: 'dehradun', name: 'Dehradun', state: 'Uttarakhand', activeRiders: 95, avgEarnings: '₹34,000' },
  { slug: 'haldwani', name: 'Haldwani', state: 'Uttarakhand', activeRiders: 35, avgEarnings: '₹28,000' },
  { slug: 'haridwar', name: 'Haridwar', state: 'Uttarakhand', activeRiders: 40, avgEarnings: '₹28,000' },
  // Maharashtra
  { slug: 'nagpur', name: 'Nagpur', state: 'Maharashtra', activeRiders: 180, avgEarnings: '₹36,000' },
  { slug: 'nashik', name: 'Nashik', state: 'Maharashtra', activeRiders: 120, avgEarnings: '₹34,000' },
  { slug: 'aurangabad', name: 'Aurangabad', state: 'Maharashtra', activeRiders: 85, avgEarnings: '₹32,000' },
  // Tamil Nadu
  { slug: 'coimbatore', name: 'Coimbatore', state: 'Tamil Nadu', activeRiders: 180, avgEarnings: '₹38,000' },
  { slug: 'trichy', name: 'Trichy', state: 'Tamil Nadu', activeRiders: 75, avgEarnings: '₹32,000' },
  { slug: 'madurai', name: 'Madurai', state: 'Tamil Nadu', activeRiders: 95, avgEarnings: '₹34,000' },
  // Karnataka
  { slug: 'mysore', name: 'Mysore', state: 'Karnataka', activeRiders: 110, avgEarnings: '₹35,000' },
  // Andhra Pradesh
  { slug: 'vijayawada', name: 'Vijayawada', state: 'Andhra Pradesh', activeRiders: 95, avgEarnings: '₹34,000' },
  { slug: 'visakhapatnam', name: 'Visakhapatnam', state: 'Andhra Pradesh', activeRiders: 120, avgEarnings: '₹36,000' },
  // Eastern India
  { slug: 'patna', name: 'Patna', state: 'Bihar', activeRiders: 140, avgEarnings: '₹32,000' },
  { slug: 'ranchi', name: 'Ranchi', state: 'Jharkhand', activeRiders: 85, avgEarnings: '₹30,000' },
  { slug: 'bhubaneswar', name: 'Bhubaneswar', state: 'Odisha', activeRiders: 110, avgEarnings: '₹34,000' },
  { slug: 'guwahati', name: 'Guwahati', state: 'Assam', activeRiders: 75, avgEarnings: '₹32,000' },
  { slug: 'siliguri', name: 'Siliguri', state: 'West Bengal', activeRiders: 55, avgEarnings: '₹30,000' },
  // Chhattisgarh
  { slug: 'raipur', name: 'Raipur', state: 'Chhattisgarh', activeRiders: 95, avgEarnings: '₹32,000' },
  { slug: 'bilaspur', name: 'Bilaspur', state: 'Chhattisgarh', activeRiders: 40, avgEarnings: '₹28,000' },
  { slug: 'durg', name: 'Durg', state: 'Chhattisgarh', activeRiders: 45, avgEarnings: '₹28,000' },
  // Jammu & Kashmir
  { slug: 'jammu', name: 'Jammu', state: 'Jammu & Kashmir', activeRiders: 55, avgEarnings: '₹30,000' },
];

export const BENEFITS = [
  { title: 'Flexible Hours', description: 'Work when you want, as much as you want', icon: 'Clock' },
  { title: 'Daily Earnings', description: 'Get paid for every completed visit', icon: 'Banknote' },
  { title: 'No Boss', description: 'Be your own boss, manage your schedule', icon: 'Crown' },
  { title: 'Free Training', description: 'Complete training and support provided', icon: 'GraduationCap' },
  { title: 'Growth Path', description: 'Become team leader, earn more', icon: 'TrendingUp' },
  { title: 'Insurance', description: 'Accident insurance coverage included', icon: 'Shield' },
];

export default {
  EARNING_STATS,
  EARNING_TIERS,
  HOW_IT_WORKS,
  REQUIREMENTS,
  RIDER_TESTIMONIALS,
  RIDER_FAQS,
  CITIES_FOR_RIDERS,
  BENEFITS,
};
