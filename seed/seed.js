require("dotenv").config();
const connectMongo = require("../db/mongo");
const Movie = require("../apis/movies/movie.model");
const { ObjectId } = require("mongodb");

async function run() {
  await connectMongo();
  // await Movie.deleteMany({});

  const sample = await Movie.insertMany(sample);
  console.log("Successfully added ", sample.length, " movies.");
  process.exit(0);
}

async function updateAllMultimoviesDomains() {
  try {
    // 1. Ensure database is connected
    await connectMongo();
    console.log("Database connected successfully.");
    const old_domain = ".homes";
    const new_domain = ".makeup";

    // 2. Filter: Target documents where the old URL domain exists in "Source.Multimovies"
    const filter = {
      "Source.Multimovies": { $regex: `^https://multimovies\\${old_domain}` },
    };

    // 3. Define the update pipeline targeting the CAPITALIZED "Source" key
    const updatePipeline = [
      {
        $set: {
          "Source.Multimovies": {
            $replaceOne: {
              input: "$Source.Multimovies",
              find: `https://multimovies${old_domain}`,
              replacement: `https://multimovies${new_domain}`,
            },
          },
        },
      },
    ];

    // 4. Execute updateMany to apply changes globally
    console.log("Updating all documents, please wait...");
    const result = await Movie.updateMany(filter, updatePipeline);

    // 5. Output processing metrics
    console.log(`Matched documents: ${result.matchedCount}`);
    console.log(`Successfully updated documents: ${result.modifiedCount}`);

    process.exit(0);
  } catch (error) {
    console.error("Global update failed:", error);
    process.exit(1);
  }
}

async function resetNotificationTTLIndex() {
  try {
    // 1. Ensure the database connection is open
    if (mongoose.connection.readyState !== 1) {
      throw new Error(
        "Database not connected. Connect mongoose before running this.",
      );
    }

    const collection = mongoose.connection.collection("notifications");

    // 2. Fetch all active indexes on the collection
    const indexes = await collection.indexes();

    // 3. Look for any existing index on the 'createdAt' field
    const ttlIndex = indexes.find(
      (idx) => idx.key && idx.key.createdAt !== undefined,
    );

    if (ttlIndex) {
      console.log(
        `Found existing TTL index: "${ttlIndex.name}". Dropping it now...`,
      );
      // Drop the index by its dynamic name
      await collection.dropIndex(ttlIndex.name);
      console.log("Old TTL index successfully dropped.");
    } else {
      console.log('No existing TTL index found on "createdAt".');
    }

    // 4. Force Mongoose to rebuild the updated index from the schema
    console.log("Building fresh 24-hour TTL index...");
    await Notification.cleanIndexes(); // Clears Mongoose cache
    await Notification.init(); // Triggers fresh index creation

    console.log("✅ Notification TTL index reset complete!");
  } catch (error) {
    console.error("❌ Error resetting Notification TTL index:", error);
  }
}

// Execute the single document update
run().catch((err) => {
  console.error(err);
  process.exit(1);
});
