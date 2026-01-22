// Simple migration script that can be copy-pasted into browser console
// This will delete old restaurants and create new ones with table structure

async function runMigration() {
  console.log('🔄 Starting migration to table-based model...');
  
  // Import Firebase functions (already loaded in the app)
  const { collection, getDocs, deleteDoc, addDoc, doc, Timestamp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
  
  // Get db instance from window (exposed by the app)
  const db = window.__FIREBASE_DB__;
  
  if (!db) {
    console.error('❌ Firebase DB not found. Make sure the app is loaded.');
    return;
  }

  try {
    // Get all existing restaurants
    const restaurantsRef = collection(db, 'restaurants');
    const snapshot = await getDocs(restaurantsRef);

    // Delete old restaurants
    console.log(`📦 Found ${snapshot.size} restaurants to migrate`);
    for (const docSnapshot of snapshot.docs) {
      await deleteDoc(doc(db, 'restaurants', docSnapshot.id));
      console.log(`🗑️  Deleted old restaurant: ${docSnapshot.data().name}`);
    }

    // Create new restaurants with table structure
    const newRestaurants = [
      {
        name: 'Burger King',
        tables: [
          { id: 'T1', type: 'table', capacity: 4, status: 'available' },
          { id: 'T2', type: 'table', capacity: 4, status: 'occupied', occupiedSince: Timestamp.now() },
          { id: 'T3', type: 'table', capacity: 6, status: 'available' },
          { id: 'T4', type: 'table', capacity: 2, status: 'available' },
          { id: 'C1', type: 'counter', capacity: 1, status: 'available' },
          { id: 'C2', type: 'counter', capacity: 1, status: 'available' },
        ],
        info: {
          seatType: 'Table / Counter',
          smoking: 'No Smoking',
          parking: 'Available (Public)',
        },
        lastUpdated: Timestamp.now(),
        order: 0,
      },
      {
        name: 'Sushi Bar',
        tables: [
          { id: 'C1', type: 'counter', capacity: 1, status: 'occupied', occupiedSince: Timestamp.now() },
          { id: 'C2', type: 'counter', capacity: 1, status: 'occupied', occupiedSince: Timestamp.now() },
          { id: 'C3', type: 'counter', capacity: 1, status: 'occupied', occupiedSince: Timestamp.now() },
          { id: 'C4', type: 'counter', capacity: 1, status: 'occupied', occupiedSince: Timestamp.now() },
          { id: 'C5', type: 'counter', capacity: 1, status: 'occupied', occupiedSince: Timestamp.now() },
          { id: 'C6', type: 'counter', capacity: 1, status: 'available' },
          { id: 'T1', type: 'table', capacity: 4, status: 'occupied', occupiedSince: Timestamp.now() },
        ],
        info: {
          seatType: 'Counter',
          smoking: 'No Smoking',
          parking: 'Available (Public)',
        },
        lastUpdated: Timestamp.now(),
        order: 1,
      },
      {
        name: 'Pasta House',
        tables: [
          { id: 'T1', type: 'table', capacity: 4, status: 'occupied', occupiedSince: Timestamp.now() },
          { id: 'T2', type: 'table', capacity: 4, status: 'available' },
          { id: 'T3', type: 'table', capacity: 2, status: 'available' },
          { id: 'T4', type: 'table', capacity: 2, status: 'occupied', occupiedSince: Timestamp.now() },
          { id: 'T5', type: 'table', capacity: 6, status: 'available' },
        ],
        info: {
          seatType: 'Table',
          smoking: 'No Smoking',
          parking: 'Available (Public)',
        },
        lastUpdated: Timestamp.now(),
        order: 2,
      },
    ];

    for (const restaurant of newRestaurants) {
      await addDoc(restaurantsRef, restaurant);
      console.log(`✅ Created new restaurant: ${restaurant.name} with ${restaurant.tables.length} tables`);
    }

    console.log('🎉 Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
runMigration();
