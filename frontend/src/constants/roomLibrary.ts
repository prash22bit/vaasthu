export interface RoomPreset {
  roomType: string;
  displayName: string;
  category:
    | 'Living'
    | 'Bedrooms'
    | 'Kitchen'
    | 'Dining'
    | 'Bathrooms'
    | 'Spiritual'
    | 'Work'
    | 'Storage'
    | 'Outdoor';
  defaultWidth: number; // world units (feet or meters)
  defaultHeight: number;
  color: string;
}

export const ROOM_LIBRARY: RoomPreset[] = [
  // Living
  {
    roomType: 'living-room',
    displayName: 'Living Room',
    category: 'Living',
    defaultWidth: 16,
    defaultHeight: 20,
    color: '#1e293b',
  },
  {
    roomType: 'family-room',
    displayName: 'Family Room',
    category: 'Living',
    defaultWidth: 14,
    defaultHeight: 18,
    color: '#1e293b',
  },
  {
    roomType: 'drawing-room',
    displayName: 'Drawing Room',
    category: 'Living',
    defaultWidth: 15,
    defaultHeight: 18,
    color: '#1e293b',
  },

  // Bedrooms
  {
    roomType: 'master-bedroom',
    displayName: 'Master Bedroom',
    category: 'Bedrooms',
    defaultWidth: 14,
    defaultHeight: 16,
    color: '#1e3a8a',
  },
  {
    roomType: 'bedroom',
    displayName: 'Bedroom',
    category: 'Bedrooms',
    defaultWidth: 12,
    defaultHeight: 14,
    color: '#1e3a8a',
  },
  {
    roomType: 'children-bedroom',
    displayName: "Children's Bedroom",
    category: 'Bedrooms',
    defaultWidth: 12,
    defaultHeight: 14,
    color: '#1e3a8a',
  },
  {
    roomType: 'guest-bedroom',
    displayName: 'Guest Bedroom',
    category: 'Bedrooms',
    defaultWidth: 12,
    defaultHeight: 14,
    color: '#1e3a8a',
  },

  // Kitchen
  {
    roomType: 'kitchen',
    displayName: 'Kitchen',
    category: 'Kitchen',
    defaultWidth: 10,
    defaultHeight: 12,
    color: '#854d0e',
  },
  {
    roomType: 'utility',
    displayName: 'Utility Area',
    category: 'Kitchen',
    defaultWidth: 6,
    defaultHeight: 8,
    color: '#854d0e',
  },

  // Dining
  {
    roomType: 'dining-room',
    displayName: 'Dining Room',
    category: 'Dining',
    defaultWidth: 12,
    defaultHeight: 14,
    color: '#701a75',
  },

  // Bathrooms
  {
    roomType: 'bathroom',
    displayName: 'Bathroom',
    category: 'Bathrooms',
    defaultWidth: 6,
    defaultHeight: 8,
    color: '#155e75',
  },
  {
    roomType: 'master-bathroom',
    displayName: 'Master Bathroom',
    category: 'Bathrooms',
    defaultWidth: 8,
    defaultHeight: 10,
    color: '#155e75',
  },

  // Spiritual
  {
    roomType: 'pooja-room',
    displayName: 'Pooja Room',
    category: 'Spiritual',
    defaultWidth: 5,
    defaultHeight: 7,
    color: '#9a3412',
  },

  // Work
  {
    roomType: 'home-office',
    displayName: 'Home Office',
    category: 'Work',
    defaultWidth: 10,
    defaultHeight: 12,
    color: '#065f46',
  },
  {
    roomType: 'study-room',
    displayName: 'Study Room',
    category: 'Work',
    defaultWidth: 10,
    defaultHeight: 12,
    color: '#065f46',
  },

  // Storage
  {
    roomType: 'store-room',
    displayName: 'Store Room',
    category: 'Storage',
    defaultWidth: 6,
    defaultHeight: 8,
    color: '#3f6212',
  },

  // Outdoor
  {
    roomType: 'balcony',
    displayName: 'Balcony',
    category: 'Outdoor',
    defaultWidth: 5,
    defaultHeight: 12,
    color: '#365314',
  },
  {
    roomType: 'corridor',
    displayName: 'Corridor',
    category: 'Outdoor',
    defaultWidth: 4,
    defaultHeight: 16,
    color: '#365314',
  },
];
