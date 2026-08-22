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

  console.log(`🔎 Searching OMDb for: "${randomSearch}"`);

  const omdbType =
    subGenre && subGenre.toLowerCase().includes("tv") ? "series" : "movie";

  const searchUrl =
    `https://www.omdbapi.com/?s=${encodeURIComponent(randomSearch)}` +
    `&type=${omdbType}` +
    `&apikey=${encodeURIComponent(omdbKey)}`;

  const response = await fetch(searchUrl);

  const searchData = await response.json();

  if (searchData.Response === "False") {
    throw new Error(searchData.Error);
  }

  const results = searchData.Search || [];

  if (!results.length) {
    throw new Error("No movies found.");
  }

  const availableResults = results.filter(
    (result) => !excludedTitles.has(String(result.Title || "").toLowerCase()),
  );
  const resultPool = availableResults.length ? availableResults : results;
  const firstResult = resultPool[Math.floor(Math.random() * resultPool.length)];

  const detailUrl =
    `https://www.omdbapi.com/?i=${encodeURIComponent(firstResult.imdbID)}` +
    `&apikey=${encodeURIComponent(omdbKey)}`;

  const detailResponse = await fetch(detailUrl);

  const data = await detailResponse.json();

  if (data.Response === "False") {
    throw new Error(data.Error);
  }

  let releaseYear = data.Year || "";

  if (releaseYear.includes("–")) {
    releaseYear = releaseYear.split("–").pop().trim();
  } else if (releaseYear.includes("-")) {
    releaseYear = releaseYear.split("-").pop().trim();
  }

  let contentType = "Movie";

  if (data.Type && data.Type.toLowerCase() === "series") {
    contentType = "Series";
  }

  /*
  |--------------------------------------------------------------------------
  | Hollywood / Bollywood
  |--------------------------------------------------------------------------
  */

  const country = (data.Country || "").toLowerCase();
  const language = (data.Language || "").toLowerCase();

  let industry = "Hollywood";

  if (country.includes("india") || language.includes("hindi")) {
    industry = "Bollywood";
  }

  /*
  |--------------------------------------------------------------------------
  | Final movie object
  |--------------------------------------------------------------------------
  */

  return {
    title: data.Title || "",

    release: releaseYear,

    Type:
      data.Genre && data.Genre !== "N/A"
        ? data.Genre.split(",").map((g) => g.trim())
        : [],

    SubGenere: [contentType],

    Wood: [industry],

    bannerUrl: data.Poster && data.Poster !== "N/A" ? data.Poster : "",
  };
}

async function sendDataToDB(movieData, domains) {
  console.log("\n📤 Sending movie to database...");

  const body = {
    ...movieData,
    SubGenere: movieData.SubGenere?.[0] || "Movie",
    MultimoviesDomain: domains.MultimoviesDomain,
    CineHDDomain: domains.CineHDDomain,
    FlixeoDomain: domains.FlixeoDomain,
    CinevaroDomain: domains.CinevaroDomain,
  };

  try {
    const apiBaseUrl = (
      process.env.AUTOMATION_API_URL ||
      process.env.PUBLIC_API_URL ||
      `http://127.0.0.1:${process.env.PORT || 8080}`
    ).replace(/\/$/, "");
    const addMovieUrl = `${apiBaseUrl}/admin/movie/add?adminPass=${encodeURIComponent(process.env.ADMIN_PASS)}`;

    const response = await fetch(addMovieUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
    });

    console.log("\n📡 API status:", response.status);

    const location = response.headers.get("location");

    const responseText = await response.text();

    if (response.status >= 300 && response.status < 400) {
      if (location) {
        const decodedLocation = decodeURIComponent(location).replace(
          /\+/g,
          " ",
        );

        if (decodedLocation.toLowerCase().includes("already exists")) {
          console.log(`⚠️ "${movieData.title}" already exists in DB.`);

          return {
            success: false,
            alreadyExists: true,
          };
        }

        if (decodedLocation.toLowerCase().includes("success")) {
          console.log(`✅ "${movieData.title}" added successfully!`);

          return {
            success: true,
            alreadyExists: false,
          };
        }

        if (decodedLocation.toLowerCase().includes("error")) {
          console.log(`❌ API returned an error for "${movieData.title}".`);

          return {
            success: false,
            alreadyExists: false,
            retryable: false,
            reason: "movie_api_redirected_to_error",
          };
        }
      }

      return {
        success: false,
        alreadyExists: false,
        retryable: false,
        reason: "movie_api_unrecognized_redirect",
      };
    }

    if (response.ok) {
      console.log(`✅ "${movieData.title}" added successfully!`);

      return {
        success: true,
        alreadyExists: false,
      };
    }

    console.log(`❌ API request failed with status ${response.status}`);

    return {
      success: false,
      alreadyExists: false,
      retryable: response.status >= 500 || response.status === 429,
      reason: `movie_api_status_${response.status}`,
    };
  } catch (error) {
    console.error("❌ Error adding movie to DB:", error.message);

    return {
      success: false,
      alreadyExists: false,
      retryable: true,
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
