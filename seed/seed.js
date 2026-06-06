require('dotenv').config();
const connectMongo = require('../db/mongo');
const Movie = require('../apis/movies/movie.model');

async function run() {
  await connectMongo();
  await Movie.deleteMany({});

  const sample = [
    {
      title: 'moviename',
      release: '2023',
      type: 'comedy',
      sources: ['link1', 'link2', 'link3'],
      bannerUrl: 'https://example.com/images/moviename-banner.jpg'
    },
    {
      title: 'Action Blast',
      release: '2024',
      type: 'action',
      sources: ['https://source.example/1', 'https://source.example/2'],
      bannerUrl: 'https://example.com/images/action-blast-banner.jpg'
    },
    {
      title: 'Love in Paris',
      release: '2022',
      type: 'romance',
      sources: ['https://source.example/3'],
      bannerUrl: 'https://example.com/images/love-in-paris-banner.jpg'
    },
    {
      title: 'Midnight Mystery',
      release: '2021',
      type: 'thriller',
      sources: ['https://source.example/4', 'https://source.example/5'],
      bannerUrl: 'https://example.com/images/midnight-mystery-banner.jpg'
    },
    {
      title: 'Laugh Riot',
      release: '2023',
      type: 'comedy',
      sources: ['https://source.example/6', 'https://source.example/7'],
      bannerUrl: 'https://example.com/images/laugh-riot-banner.jpg'
    },
    {
      title: 'Future Quest',
      release: '2025',
      type: 'sci-fi',
      sources: ['https://source.example/8'],
      bannerUrl: 'https://example.com/images/future-quest-banner.jpg'
    },
    {
      title: 'Wild Safari',
      release: '2020',
      type: 'adventure',
      sources: ['https://source.example/9', 'https://source.example/10'],
      bannerUrl: 'https://example.com/images/wild-safari-banner.jpg'
    },
    {
      title: 'Retro Nights',
      release: '2019',
      type: 'drama',
      sources: ['https://source.example/11'],
      bannerUrl: 'https://example.com/images/retro-nights-banner.jpg'
    },
    {
      title: 'Haunted Hills',
      release: '2024',
      type: 'horror',
      sources: ['https://source.example/12', 'https://source.example/13'],
      bannerUrl: 'https://example.com/images/haunted-hills-banner.jpg'
    },
    {
      title: 'The Final Stand',
      release: '2023',
      type: 'action',
      sources: ['https://source.example/14'],
      bannerUrl: 'https://example.com/images/the-final-stand-banner.jpg'
    },
  ];

  await Movie.insertMany(sample);
  console.log('Cleared local data and seeded', sample.length, 'movies');
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
