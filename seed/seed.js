require("dotenv").config();
const connectMongo = require("../db/mongo");
const Movie = require("../apis/movies/movie.model");
const { ObjectId } = require("mongodb"); 

async function run() {
  await connectMongo();
  await Movie.deleteMany({});

  const sample = [
  {
    "title": "Ramayana",
    "release": "2026",
    "type": [],
    "sources": {
      "Multimovies": "https://multimovies.com/movie/123"
    },
    "bannerUrl": "https://resizing.flixster.com/8iYKTCLToL1UOcCX-73V7rvrc1s=/fit-in/352x330/v2/https://resizing.flixster.com/9LhBaOHVitgTOrsL8uskWHd61bo=/ems.cHJkLWVtcy1hc3NldHMvbW92aWVzL2UwOWI0N2IzLThkNjctNDAxMC1iMzhkLWE1MzgyZGNjOWYyNS5qcGc="
  }
  ];

  await Movie.insertMany(sample);
  console.log("Cleared local data and seeded", sample.length, "movies");
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
    const filter = { "Source.Multimovies": { $regex: `^https://multimovies\\${old_domain}` } };

    // 3. Define the update pipeline targeting the CAPITALIZED "Source" key
    const updatePipeline = [
      {
        $set: {
          "Source.Multimovies": {
            $replaceOne: {
              input: "$Source.Multimovies",
              find: `https://multimovies${old_domain}`,
              replacement: `https://multimovies${new_domain}`
            }
          }
        }
      }
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

async function expireNotifEarlyDeletion() {
  try {
    await connectMongo();
    const result = Movie.notifications.getIndexes("notifications");
    console.log("Current indexes on notifications collection:", result);
    console.log("Waiting for expired notifications to be automatically deleted...");
  } catch (error) {
    console.error("Failed to delete expired notifications:", error);
    process.exit(1);
  }
}


// Execute the single document update
expireNotifEarlyDeletion().catch((err) => {
  console.error(err);
  process.exit(1);
});