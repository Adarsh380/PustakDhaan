const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pustakdhaan';

async function cleanupCollections() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // List of collections to drop (old structure)
    const collectionsToClean = [
      'books',
      'donations', 
      'users' // Only if you want to clean users too
    ];

    for (const collectionName of collectionsToClean) {
      try {
        await mongoose.connection.db.collection(collectionName).drop();
        console.log(`✅ Dropped collection: ${collectionName}`);
      } catch (error) {
        if (error.code === 26) {
          console.log(`⚠️  Collection ${collectionName} doesn't exist, skipping...`);
        } else {
          console.error(`❌ Error dropping ${collectionName}:`, error.message);
        }
      }
    }
    
    console.log('Collections cleanup completed. You can now run the seed script.');
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

cleanupCollections();
