require("dotenv").config();
const express = require("express");
const Movie = require("../movies/movie.model");
const MovieRequest = require("../movies/movieRequest.model");
const Notification = require("../movies/notif.model");

const router = express.Router();

function getAdminCredentials(req) {
  return {
    accessToken: req.query.accessToken || req.body.accessToken,
    adminPass: req.query.adminPass || req.body.adminPass,
  };
}

function buildAdminRedirect(req, extras = {}) {
  const { accessToken, adminPass } = getAdminCredentials(req);
  const searchTitle = req.query.searchTitle || req.body.searchTitle;
  const params = new URLSearchParams({
    accessToken,
    adminPass,
    ...(searchTitle ? { searchTitle } : {}),
    ...extras,
  });
  return `/admin?${params.toString()}`;
}

function parseType(raw) {
  if (!raw) return [];
  return String(raw)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function detectPlatformFromUrl(url) {
  const platforms = {
    multimovies: "Multimovies",
    onemovies: "OneMovies",
    streamimbd: "StreamImbd",
    cineby: "CineBy",
    cinehd: "CineHD",
  };

  const lowerUrl = url.toLowerCase();
  for (const [key, name] of Object.entries(platforms)) {
    if (lowerUrl.includes(key)) {
      return name;
    }
  }
  return null;
}

function parseSource(raw) {
  const result = {};
  if (!raw) return result;

  const trimmed = String(raw).trim();
  if (!trimmed) return result;

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch (_err) {
      // fallback to line parsing
    }
  }

  trimmed.split(/\r?\n/).forEach((line) => {
    const cleanLine = line && line.trim();
    if (!cleanLine) return;

    // Check if line is a URL (contains = for key=value format)
    if (cleanLine.includes("=")) {
      const [key, value] = cleanLine
        .split("=")
        .map((part) => part && part.trim());
      if (key && value) {
        result[key] = value;
      }
    } else if (
      cleanLine.startsWith("http://") ||
      cleanLine.startsWith("https://")
    ) {
      // Auto-detect platform from URL
      const detectedPlatform = detectPlatformFromUrl(cleanLine);
      if (detectedPlatform) {
        result[detectedPlatform] = cleanLine;
      }
    }
  });

  return result;
}

function normalizeMultimoviesDomain(rawValue) {
  const trimmed = String(rawValue || "").trim();
  if (!trimmed) return "";

  let cleaned = trimmed;
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    try {
      const url = new URL(cleaned);
      cleaned = url.host;
    } catch (_err) {
      cleaned = cleaned.replace(/https?:\/\//i, "").split("/")[0];
    }
  }

  cleaned = cleaned.toLowerCase();
  if (cleaned.startsWith("www.")) {
    cleaned = cleaned.slice(4);
  }

  if (cleaned.startsWith("multimovies.")) {
    cleaned = cleaned.slice("multimovies".length);
  }

  if (cleaned && !cleaned.startsWith(".")) {
    cleaned = "." + cleaned;
  }

  return cleaned;
}

function ensureAdmin(req, res, next) {
  const { adminPass } = getAdminCredentials(req);
  const expectedPass = process.env.ADMIN_PASS;

  if (!expectedPass) {
    return res.status(500).send("Server missing ADMIN_PASS configuration");
  }

  if (!adminPass || adminPass !== expectedPass) {
    return res.status(401).send("Unauthorized admin access");
  }

  next();
}

async function getMoviesData(searchTitle, year, subGenre) {
  const omdbKey = process.env.OMDB_KEY;

  let omdbType = "";

  if (subGenre && subGenre.toLowerCase().includes("tv")) {
    omdbType = "series";
  } else {
    omdbType = "movie";
  }

  const url =
    `https://www.omdbapi.com/?t=${encodeURIComponent(searchTitle)}` +
    `&apikey=${encodeURIComponent(omdbKey)}` +
    (year ? `&y=${encodeURIComponent(year)}` : "") +
    `&type=${omdbType}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.Response === "False") {
    throw new Error(data.Error);
  }

  let releaseYear = data.Year || "";

  if (releaseYear.includes("–")) {
    releaseYear = releaseYear.split("–").pop().trim();
  } else if (releaseYear.includes("-")) {
    releaseYear = releaseYear.split("-").pop().trim();
  }

  return {
    release: releaseYear,
    bannerUrl: data.Poster && data.Poster !== "N/A" ? data.Poster : "",

    Type:
      data.Genre && data.Genre !== "N/A"
        ? data.Genre.split(",").map((g) => g.trim())
        : [],
  };
}

router.get("/", ensureAdmin, async (req, res, next) => {
  try {
    const { accessToken, adminPass } = getAdminCredentials(req);
    const searchTitle = (req.query.searchTitle || "").trim();
    let movies = [];

    if (searchTitle) {
      movies = await Movie.find({
        title: { $regex: searchTitle, $options: "i" },
      })
        .sort({ createdAt: -1 })
        .lean();
    }

    const upcomingRequests = await MovieRequest.find({ status: "pending" })
      .sort({ requestedAt: -1 })
      .lean();
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.render("admin", {
      movies,
      upcomingRequests,
      notifications,
      accessToken,
      adminPass,
      searchTitle,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/movie/add", ensureAdmin, async (req, res, next) => {
  try {
    const title = (req.body.title || "").trim();
    const rawMultimoviesDomain =
      req.body.MultimoviesDomain || req.body.multimoviesDomain || "";
    const multimoviesDomain = normalizeMultimoviesDomain(rawMultimoviesDomain);
    const rawSubGenere = req.body.SubGenere || req.body.subGenere || "";
    const subGenereValues = parseType(rawSubGenere);
    const primarySubGenere = (subGenereValues[0] || "").toLowerCase();

    if (!title) {
      return res.redirect(
        buildAdminRedirect(req, { error: "Title is required." }),
      );
    }

    // Parse sources
    const sources = parseSource(req.body.Source);

    // Auto-generate Multimovies URL if missing
    if (!sources.Multimovies) {
      const slug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "") // remove special chars
        .replace(/\s+/g, "-"); // spaces -> hyphens

      if (primarySubGenere === "movie" || primarySubGenere === "movies") {
        sources.Multimovies = `https://multimovies${multimoviesDomain}/movies/${slug}/`;
      } else if (
        primarySubGenere === "tvshow" ||
        primarySubGenere === "tvshows" ||
        primarySubGenere === "tv show" ||
        primarySubGenere === "tv shows" ||
        primarySubGenere === "TvShow" ||
        primarySubGenere === "TvShows" ||
        primarySubGenere === "Tv Show" ||
        primarySubGenere === "Tv Shows"
      ) {
        sources.Multimovies = `https://multimovies${multimoviesDomain}/tvshows/${slug}/`;
      }
    }

    // Check if movie already exists
    const movie_already_exists = await Movie.findOne({
      title: { $regex: `^${title}$`, $options: "i" },
      release: (req.body.release || "").trim(),
      Type: parseType(req.body.Type),
      SubGenere: parseType(req.body.SubGenere),
      Wood: parseType(req.body.Wood),
    });

    if (movie_already_exists) {
      return res.redirect(
        buildAdminRedirect(req, {
          error: "Movie with this title already exists.",
        }),
      );
    }

    const moviesData = await getMoviesData(
      title,
      req.body.release,
      req.body.SubGenere,
    );

    const movie = new Movie({
      title,

      release: moviesData.release || req.body.release,

      Type: moviesData.Type || [],

      Source: sources,

      SubGenere: parseType(req.body.SubGenere),

      Wood: parseType(req.body.Wood),

      bannerUrl: moviesData.bannerUrl || "",
    });

    await movie.save();

    return res.redirect(
      buildAdminRedirect(req, {
        success: "Movie added successfully.",
      }),
    );
  } catch (err) {
    console.error(err);

    if (err.name === "ValidationError") {
      return res.redirect(
        buildAdminRedirect(req, {
          error: "Invalid movie data.",
        }),
      );
    }

    next(err);
  }
});

router.post("/movie/update/:id", ensureAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const title = (req.body.title || "").trim();
    if (!title) {
      return res.redirect(
        buildAdminRedirect(req, { error: "Title is required for update." }),
      );
    }

    await Movie.findByIdAndUpdate(
      id,
      {
        title,
        release: (req.body.release || "").trim(),
        Type: parseType(req.body.Type),
        Source: parseSource(req.body.Source),
        SubGenere: parseType(req.body.SubGenere),
        Wood: parseType(req.body.Wood),
        bannerUrl: (req.body.bannerUrl || "").trim(),
      },
      { runValidators: true },
    );

    return res.redirect(
      buildAdminRedirect(req, { success: "Movie updated successfully." }),
    );
  } catch (err) {
    next(err);
  }
});

router.post("/movie/delete/:id", ensureAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await Movie.findByIdAndDelete(id);
    return res.redirect(
      buildAdminRedirect(req, { success: "Movie deleted successfully." }),
    );
  } catch (err) {
    next(err);
  }
});

router.post("/request/status/:id", ensureAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const status = (req.body.status || "").trim().toLowerCase();
    const allowed = ["pending", "approved", "rejected"];

    if (!allowed.includes(status)) {
      return res.redirect(
        buildAdminRedirect(req, { error: "Invalid status." }),
      );
    }

    if (status === "pending") {
      await MovieRequest.findByIdAndUpdate(
        id,
        { status },
        { runValidators: true },
      );
      return res.redirect(
        buildAdminRedirect(req, { success: "Request remains pending." }),
      );
    }

    await MovieRequest.findByIdAndDelete(id);
    return res.redirect(
      buildAdminRedirect(req, { success: `Request ${status} and removed.` }),
    );
  } catch (err) {
    next(err);
  }
});

router.post(
  "/change-domain-multimovies",
  ensureAdmin,
  async (req, res, next) => {
    try {
      const old_domain = req.body.old_domain;
      const new_domain = req.body.new_domain;

      if (!old_domain || !new_domain) {
        return res.redirect(
          buildAdminRedirect(req, {
            error: "Both old and new domain are required.",
          }),
        );
      }

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

      const result = await Movie.updateMany(filter, updatePipeline);
      return res.redirect(
        buildAdminRedirect(req, {
          success: `${result.modifiedCount} Docs Updated from ${old_domain} to ${new_domain}.`,
        }),
      );
    } catch (error) {
      console.error("Domain update failed:", error);
      return res.status(500).json({ error: "Domain update failed." });
    }
  },
);

module.exports = router;
