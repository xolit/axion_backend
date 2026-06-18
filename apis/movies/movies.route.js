const express = require("express");
const Movie = require("./movie.model");
const cache = require("../../middlewares/cache");

const router = express.Router();

const payloadForData =
  "_id title release Type Source SubGenere Wood bannerUrl createdAt";

// GET /movie/:movieName -> find movies matching title
router.get(
  "/:movieName",
  cache((req) => `movie:${req.params.movieName.toLowerCase()}`, 120),
  async (req, res, next) => {
    try {
      const { movieName } = req.params;
      const results = await Movie.find({
        title: { $regex: movieName, $options: "i" },
      })
        .select(payloadForData)
        .limit(50)
        .lean();
      return res.json(results);
    } catch (err) {
      next(err);
    }
  },
);

// GET /home?page=1 -> paginated 10 per page
router.get(
  "/",
  cache((req) => `home:page:${req.query.page || 1}`, 60),
  async (req, res, next) => {
    try {
      const page = Math.max(parseInt(req.query.page || "1", 10), 1);
      const limit = 10;
      const skip = (page - 1) * limit;
      const movies = await Movie.find()
        .select(payloadForData)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      const total = await Movie.countDocuments();
      const nextPage = skip + movies.length < total ? page + 1 : null;
      return res.json({ page, nextPage, movies });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
