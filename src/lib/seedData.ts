import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Seed initial restaurant data to Firestore
 * Run this once to populate the database with sample data
 */
export async function seedRestaurants() {
  const restaurants = [
    {
      name: 'Burger King',
      status: 'open',
      waitTime: '0-10 min',
      lastUpdated: Timestamp.now(),
      info: {
        seatType: 'Table / Counter',
        smoking: 'No Smoking',
        parking: 'Available (Public)',
      },
      order: 0,
    },
    {
      name: 'Sushi Bar',
      status: 'full',
      waitTime: '45 min',
      lastUpdated: Timestamp.now(),
      info: {
        seatType: 'Counter',
        smoking: 'No Smoking',
        parking: 'Available (Public)',
      },
      order: 1,
    },
    {
      name: 'Pasta House',
      status: 'busy',
      waitTime: '10-20 min',
      lastUpdated: Timestamp.now(),
      info: {
        seatType: 'Table',
        smoking: 'No Smoking',
        parking: 'Available (Public)',
      },
      order: 2,
    },
  ];

  try {
    for (const restaurant of restaurants) {
      await addDoc(collection(db, 'restaurants'), restaurant);
      console.log(`Added: ${restaurant.name}`);
    }
    console.log('✅ Seed data added successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}
