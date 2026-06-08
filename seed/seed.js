require("dotenv").config();
const connectMongo = require("../db/mongo");
const Movie = require("../apis/movies/movie.model");

async function run() {
  await connectMongo();
  await Movie.deleteMany({});

  const sample = [
    {
      _id: "6a2583545a8dba4e5017353c",
      title: "Kartavya",
      release: "2026",
      Type: ["Action", "Crime", "Drama", "Mystery & Thriller"],
      Source: {
        Multimovies: "https://multimovies.homes/movies/kartavya/",
        OneMovies:
          "https://www.onemovie.in/movie/kartavya-2026-crime-drama-movie",
      },
      bannerUrl:
        "https://resizing.flixster.com/Zx3r7oN3aHTHDZNQGEKPcEqKkpA=/68x102/v2/https://resizing.flixster.com/-XZAfHZM39UwaGJIFWKAE8fS0ak=/v3/t/assets/p33062088_p_v8_aa.jpg",
    },
    {
      _id: "6a25828783e01f2d584fea53",
      title: "Obsession",
      release: "2026",
      Type: ["Horror", "Mystery & Thriller"],
      Source: {
        Multimovies: "https://multimovies.homes/movies/obsession/",
      },
      bannerUrl:
        "https://resizing.flixster.com/ZO8BttxEja5hOF0pnYTVaYVUeeM=/68x102/v2/https://resizing.flixster.com/wciPMzUm5zbBhWKN24eGdoRfK8I=/ems.cHJkLWVtcy1hc3NldHMvbW92aWVzLzBlZDNhZmI5LTM3N2EtNGIyZC1iZTA5LTU0NzUyY2M2ZGYyYi5qcGc=",
    },
    {
      _id: "6a257e4e4fff00c8d2614e64",
      title: "Lee Cronin's The Mummy",
      release: "2026",
      Type: ["Horror", "Action"],
      Source: {
        Multimovies: "https://multimovies.homes/movies/lee-cronins-the-mummy/",
        OneMovies:
          "https://www.onemovie.in/movie/the-mummy-2026-lee-cronin-horror-movie-hindi-dubbed-full-movie-hd",
      },
      bannerUrl:
        "https://resizing.flixster.com/5s904zm3dfEbjy6XMNUEJdG2tc4=/fit-in/352x330/v2/https://resizing.flixster.com/jJ2BDS3_ZsdA6Nb9-I47TIDcti8=/ems.cHJkLWVtcy1hc3NldHMvbW92aWVzLzUwMjMwNDRjLWZmYWYtNDMyMS1iOWYyLTgzYzgwOGY2ZjFkMC5qcGc=",
    },
    {
      _id: "6a257e4e4fff00c8d2614e60",
      title: "Jolly LLB 3",
      release: "2025",
      Type: ["Comedy", "Drama", "Mystery & Thriller"],
      Source: {
        Multimovies: "https://multimovies.homes/movies/jolly-llb-3/",
        OneMovies: "https://www.onemovie.in/video/2015",
      },
      bannerUrl:
        "https://resizing.flixster.com/g9wSmostL3O7_UnP4JpruJuW8HA=/fit-in/352x330/v2/https://resizing.flixster.com/Tnv_S4QO2auWsBWLEHCf6utfJHw=/ems.cHJkLWVtcy1hc3NldHMvbW92aWVzL2QzN2RjYzNhLWQ3MTEtNGUzZi05ODVhLTY3NGM5M2YwNzQ4Yy5qcGc=",
    },
    {
      _id: "6a257e4e4fff00c8d2614e65",
      title: "Michael",
      release: "2026",
      Type: ["Biographical", "Musical", "Drama"],
      Source: {
        Multimovies: "https://multimovies.homes/movies/michael-2/",
        OneMovies:
          "https://www.onemovie.in/movie/michael-2026-biographical-musical-drama-full-movie-hd",
      },
      bannerUrl:
        "https://resizing.flixster.com/MbqWuwCa3avPa0uESDGbDlGDn2c=/68x102/v2/https://resizing.flixster.com/hcHFyHYxNIIgMilY0mC2JoIhggk=/ems.cHJkLWVtcy1hc3NldHMvbW92aWVzL2JlYTIxNGM2LTkyZmEtNDJlMC05ODA4LWQ3YTBjYzE2MzQzNi5qcGc=",
    },
    {
      _id: "6a257e4e4fff00c8d2614e63",
      title: "ORomeo",
      release: "2026",
      Type: ["Action", "Mystery & Thriller", "Romance"],
      Source: {
        Multimovies: "https://multimovies.homes/movies/oromeo/",
        OneMovies:
          "https://www.onemovie.in/movie/o-romeo-2026-action-romantic-thriller",
      },
      bannerUrl:
        "https://resizing.flixster.com/he6sOmxfdSTrsxvbj7XB3-lsuMc=/fit-in/352x330/v2/https://resizing.flixster.com/3RPG01zNRu9KnzRzJvjtRto17Nc=/ems.cHJkLWVtcy1hc3NldHMvbW92aWVzLzUzNzBlZjQwLTZjYmEtNGViNy1iZjExLTk3NTYwMGQ0MTgwOS5wbmc=",
    },
    {
      _id: "6a257e4e4fff00c8d2614e5f",
      title: "The Boys",
      release: "2019",
      Type: ["Action", "Comedy", "Superhero"],
      Source: {
        Multimovies: "https://multimovies.homes/tvshows/the-boys/",
      },
      bannerUrl:
        "https://resizing.flixster.com/7nlt-mNKOKsfx3gwvHM20ZyCdtM=/206x305/v2/https://resizing.flixster.com/-XZAfHZM39UwaGJIFWKAE8fS0ak=/v3/t/assets/p16826253_b_v13_ab.jpg",
    },
    {
      _id: "6a257e4e4fff00c8d2614e61",
      title: "Stranger Things",
      release: "2016",
      Type: ["Sci-Fi", "Horror", "Drama"],
      Source: {
        Multimovies: "https://multimovies.homes/tvshows/stranger-things/",
      },
      bannerUrl:
        "https://resizing.flixster.com/N3cbKuBFhTbb_SDo-nu8fTUyX10=/fit-in/352x330/v2/https://resizing.flixster.com/3kl0YaaOu8zAfi13ohK0kRnMdFc=/ems.cHJkLWVtcy1hc3NldHMvdHZzZXJpZXMvMzdiMGI2YTItOWU1My00ODNkLTgzNTItOGZmNzE3Y2M0MzBiLmpwZw==",
    },
    {
      _id: "6a257e4e4fff00c8d2614e5d",
      title: "Dhurandhar: The Revenge",
      release: "2026",
      Type: ["Action", "Thriller", "Drama"],
      Source: {
        Multimovies: "https://multimovies.homes/movies/dhurandhar-the-revenge/",
      },
      bannerUrl:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRXZrfUMquTfdWq64yVsK3_iJpYx5emiogoDQ&s",
    },
    {
      _id: "6a257e4e4fff00c8d2614e5e",
      title: "Mortal Kombat 2",
      release: "2026",
      Type: ["Action", "Martial Arts", "Fantasy"],
      Source: {
        Multimovies: "https://multimovies.homes/movies/mortal-kombat-ii/",
      },
      bannerUrl:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSemndzzPs7mvXKQ7aTLtgKZNm9mo3C7xyH6A&s",
    },
    {
      _id: "6a257e4e4fff00c8d2614e5c",
      title: "Bhooth Bangla",
      release: "2026",
      Type: ["Comedy", "Horror", "Thriller"],
      Source: {
        Multimovies: "https://multimovies.homes/movies/bhooth-bangla/",
        OneMovies: "https://www.onemovie.in/video/2001",
      },
      bannerUrl:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRu7dwqRSkDdOa88385qMDv0zAPtVTFYsn2bA&s",
    },
  ];

  await Movie.insertMany(sample);
  console.log("Cleared local data and seeded", sample.length, "movies");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
