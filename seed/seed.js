require('dotenv').config();
const connectMongo = require('../db/mongo');
const Movie = require('../apis/movies/movie.model');

async function run() {
  await connectMongo();
  // await Movie.deleteMany({});

  const sample = [
    {
      title: '',
      release: '',
      type: '',
      sources: ['',''],
      bannerUrl: ''
    },
  ];

  await Movie.insertMany(sample);
  console.log('Cleared local data and seeded', sample.length, 'movies');
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
