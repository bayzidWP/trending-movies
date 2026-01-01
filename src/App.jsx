import { useState, useEffect } from 'react';
import Search from './components/Search';
import Spinner from './components/Spinner';
import MovieCard from './components/MovieCard';
import { useDebounce } from 'react-use';
import { getTrendingMovies, updateSearchCount } from './appwrite';


const API_BASE_URL = 'https://api.themoviedb.org/3';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
    method: 'GET',
    headers: { // headers
        accept: 'application/json', // Define what kind of data to be accessed in our application (Json Object).
        Authorization: `Bearer ${API_KEY}` // it verifies who is trying to make this request.
    }
}

const App = () => {

    const [deBouncedSearchTerm, setDeBouncedSearchTerm] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [movieList, setMovieList] = useState([]);

    const [errorMessage, setErrorMessage] = useState('');
    const [trendingMovies, setTrendingMovies] = useState([]);
    const [isLoading, setILoading] = useState(false);

    // Debounce the search term to avoid too many API calls
    // in this case, it waits for 500 milliseconds after the last change to the searchTerm
    useDebounce(() => setDeBouncedSearchTerm(searchTerm), 500, [searchTerm]);
    const fetchMovies = async (query = '') => {
        setILoading(true);
        setErrorMessage('');
        try {
            const endpoint = query ?
                `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
                : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
            const response = await fetch(endpoint, API_OPTIONS);

            if (!response.ok) {
                throw new error('Failed to fetch movie');
            }
            // Parse the response as JSON
            const data = await response.json();

            // Check if the response is valid
            if (data.Response === false) {
                setErrorMessage(data.Error || 'Failed to fetch movie');
                setMovieList([]);
                return;
            }

            setMovieList(data.results || []);

            // If a query is provided and results are found, update the search count
            // This is where we call the Appwrite function to update the search count
            // We assume that the first result is the most relevant one
            // and we update the search count for that movie
            if (query && data.results.length > 0) {
                await updateSearchCount(query, data.results[0]);
            }

        } catch (error) {
            console.error(`Error while fetching Movies: ${errorMessage}`);
            setErrorMessage('Error fetching Movies. Please try again later');
        } finally {
            setILoading(false);
        }
    }


    // Fetch trending movies on initial load.
    const loadTrendingMovies = async () => {
        try {
            const movies = await getTrendingMovies();
            console.log(movies);

            setTrendingMovies(movies);
        } catch (error) {
            console.error(error);
        }
    }

    // Fetch movies based on the debounced search term
    // This will be called whenever the debounced search term changes
    // It will fetch movies based on the search term or load trending movies if the search term is empty
    useEffect(() => {
        fetchMovies(deBouncedSearchTerm);
    }, [deBouncedSearchTerm]);


    useEffect(() => {
        // Load trending movies when the component mounts
        loadTrendingMovies();
    }, []);

    return (
        <main>
            <div className='pattern' />
            <div className="wrapper">
                <header>
                    <img src='./hero.png' alt='Hero banner' />
                    <h1>Find <span className='text-gradient'>Movies</span> You'll Enjoy Without Hassle </h1>

                    <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                </header>

                {trendingMovies.length > 0 && (
                    <section className='trending'>
                        <h2>Trending Movies</h2>
                        <ul>
                            {trendingMovies.map((movie, index) => (
                                <li key={movie.$id}>
                                    <p>{index + 1}</p>
                                    <img src={movie.poster_url} alt={movie.title} />
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <section className='all-movies'>
                    <h2>All Movies</h2>

                    {isLoading ? (
                        <Spinner />
                    ) : errorMessage ? (
                        <p className='error'>{errorMessage}</p>
                    ) : (
                        <ul>
                            {movieList.map((movie) => (
                                <MovieCard key={movie.id} movie={movie} />
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    );
}

export default App
