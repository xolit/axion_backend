require("dotenv").config();
const mongoose = require("mongoose");
const Movie = require("../apis/movies/movie.model");

const searchTerms = [
  "man",
  "love",
  "war",
  "dark",
  "night",
  "life",
  "world",
  "dead",
  "star",
  "home",
  "last",
  "king",
  "girl",
  "boy",
  "fire",
  "time",
  "game",
  "city",
  "house",
  "dream",
];

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:");
    console.error(error.message);

    process.exit(1);
  }
}

function getDomainSuffix(url, prefix) {
  if (!url) {
    return "";
  }

  try {
    const hostname = new URL(url).hostname.toLowerCase();

    const expectedPrefix = `${prefix.toLowerCase()}.`;

    if (hostname.startsWith(expectedPrefix)) {
      return hostname.slice(prefix.length);
    }

    return "";
  } catch (error) {
    console.log(`⚠️ Invalid ${prefix} URL:`, url);
    return "";
  }
}

async function getLatestDomains() {
  const latestMovie = await Movie.findOne().sort({ createdAt: -1 }).lean();

  if (!latestMovie) {
    throw new Error("No existing movie found in database.");
  }

  const source = latestMovie.Source || {};

  const domains = {
    MultimoviesDomain: getDomainSuffix(source.Multimovies, "multimovies"),

    CineHDDomain: getDomainSuffix(source.CineHD, "cinehd"),

    FlixeoDomain: getDomainSuffix(source.Flixeo, "flixeo"),

    CinevaroDomain: getDomainSuffix(source.Cinevaro, "cinevaro"),
  };

  return domains;
}

async function getRandomMovie(subGenre, excludedTitles = new Set()) {
  const omdbKey = process.env.OMDB_KEY;

  const randomSearch =
    searchTerms[Math.floor(Math.random() * searchTerms.length)];
  const page = Math.floor(Math.random() * 5) + 1;

  console.log(`🔎 Searching OMDb for: "${randomSearch}"`);

  const omdbType =
    subGenre && subGenre.toLowerCase().includes("tv") ? "series" : "movie";

  const searchUrl =
    `https://www.omdbapi.com/?s=${encodeURIComponent(randomSearch)}` +
    `&type=${omdbType}` +
    `&page=${page}` +
    `&apikey=${encodeURIComponent(omdbKey)}`;

  const response = await fetch(searchUrl);

  const searchData = await response.json();
  if (searchData.Response === "False") {
    throw new Error(searchData.Error);
  }

  const results = searchData.Search || [];
  const availableResults = results.filter(
    (result) => !excludedTitles.has(String(result.Title || "").toLowerCase()),
  );
  const resultPool = availableResults.length ? availableResults : results;
  if (!resultPool.length) throw new Error("No movies found.");

  const selectedResult =
    resultPool[Math.floor(Math.random() * resultPool.length)];
  const detailResponse = await fetch(
    `https://www.omdbapi.com/?i=${encodeURIComponent(selectedResult.imdbID)}&apikey=${encodeURIComponent(omdbKey)}`,
  );
  const data = await detailResponse.json();
  if (data.Response === "False") throw new Error(data.Error);

  let releaseYear = data.Year || "";
  if (releaseYear.includes("–") || releaseYear.includes("-")) {
    releaseYear = releaseYear.split(/[–-]/).pop().trim();
  }

  const contentType =
    data.Type?.toLowerCase() === "series" ? "Series" : "Movie";
  const country = (data.Country || "").toLowerCase();
  const language = (data.Language || "").toLowerCase();

  return {
    title: data.Title || "",
    release: releaseYear,
    Type:
      data.Genre && data.Genre !== "N/A"
        ? data.Genre.split(",").map((genre) => genre.trim())
        : [],
    SubGenere: [contentType],
    Wood: [
      country.includes("india") || language.includes("hindi")
        ? "Bollywood"
        : "Hollywood",
    ],
    bannerUrl: data.Poster && data.Poster !== "N/A" ? data.Poster : "",
  };
}

function buildSources(title, subGenre, domains) {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
  const query = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "+");
  const isTv = subGenre.toLowerCase().includes("tv");

  return {
    Multimovies: `https://multimovies${domains.MultimoviesDomain}/${isTv ? "tvshows" : "movies"}/${slug}/`,
    CineHD: `https://cinehd${domains.CineHDDomain}/search?q=${query}`,
    Flixeo: `https://flixeo${domains.FlixeoDomain}/search?q=${query}`,
    Cinevaro: `https://cinevaro${domains.CinevaroDomain}/#/browse/${query}`,
  };
}

async function sendDataToDB(movieData, domains) {
  console.log("\n📤 Saving movie directly to MongoDB...");
  const escapedTitle = movieData.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const existingMovie = await Movie.exists({
    title: { $regex: `^${escapedTitle}$`, $options: "i" },
    release: movieData.release,
  });

  if (existingMovie) {
    console.log(`⚠️ "${movieData.title}" already exists in DB.`);
    return { success: false, alreadyExists: true };
  }

  try {
    await Movie.create({
      ...movieData,
      Source: buildSources(movieData.title, movieData.SubGenere[0], domains),
    });
    console.log(`✅ "${movieData.title}" added successfully!`);
    return { success: true, alreadyExists: false };
  } catch (error) {
    console.error("❌ Error saving movie to MongoDB:", error.message);
    return {
      success: false,
      alreadyExists: false,
      retryable: true,
      reason: "mongodb_insert_failed",
    };
  }
}

async function runAutoSeed() {
  console.log("\n========================================");
  console.log("🚀 AUTO MOVIE SEED RUN");
  console.log("========================================\n");

  try {
    const domains = await getLatestDomains();

    const MAX_ATTEMPTS = 20;
    const attemptedTitles = new Set();

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      console.log(`\n🔄 Attempt ${attempt}/${MAX_ATTEMPTS}`);

      let movie;
      try {
        movie = await getRandomMovie(undefined, attemptedTitles);
      } catch (error) {
        console.error("❌ OMDb lookup failed:", error.message);
        continue;
      }

      attemptedTitles.add(movie.title.toLowerCase());

      const result = await sendDataToDB(movie, domains);

      if (result.success) {
        console.log("\n🎉 Movie added successfully by automation!");
        return { success: true, title: movie.title };
      }

      if (result.alreadyExists) {
        console.log("🔁 Movie already exists. Trying another...");
        continue;
      }

      if (result.retryable) {
        console.log("🔁 Movie API failed temporarily. Trying another...");
        continue;
      }

      console.log("❌ Failed to add movie.");
      return {
        success: false,
        reason: result.reason || "movie_api_rejected",
      };
    }

    console.log("⚠️ Maximum attempts reached.");
    return { success: false, reason: "maximum_attempts_reached" };
  } catch (error) {
    console.error("❌ Auto seed error:", error.message);
    return { success: false, reason: error.message };
  }
}

async function startAutoSeed() {
  if (
    !process.env.MONGO_URI ||
    !process.env.OMDB_KEY ||
    !process.env.ADMIN_PASS
  ) {
    throw new Error("MONGO_URI, OMDB_KEY, and ADMIN_PASS must be configured");
  }

  await connectDB();
  return runAutoSeed();
}

module.exports = { startAutoSeed };

if (require.main === module) {
  startAutoSeed()
    .then((result) => {
      process.exitCode = result?.success ? 0 : 1;
    })
    .catch((error) => {
      console.error("❌ Auto seed process failed:", error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    });
}
