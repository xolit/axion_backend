require("dotenv").config();
const connectMongo = require("../db/mongo");
const Movie = require("../apis/movies/movie.model");

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

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
