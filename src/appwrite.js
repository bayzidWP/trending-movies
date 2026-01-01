
import { Client, Databases, ID, Query } from 'appwrite';

const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(PROJECT_ID); // Your Appwrite Endpoint;

const database = new Databases(client);

export const updateSearchCount = async (searchTerm, movie) => {
    // use appwrite sdk to check if searchTerm count exists in the database.
    try {
        const result = await database.listDocuments(
            DATABASE_ID,
            COLLECTION_ID,
            [Query.equal('searchTerm', searchTerm)]
        );

        // If it exists, increment the count
        if (result.documents.length > 0) {
            const doc = result.documents[0];
            console.log('Found document:', doc);

            await database.updateDocument(
                DATABASE_ID,
                COLLECTION_ID,
                doc.$id,
                {
                    count: doc.count + 1, // Ensure count is a valid integer
                }

            );
        } else {
            // If it doesn't exist, create a new document with count 1
            await database.createDocument(
                DATABASE_ID,
                COLLECTION_ID,
                ID.unique(),
                {
                    searchTerm: searchTerm,
                    count: 1,
                    movie_id: movie.id, // Assuming movie has an id property
                    poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`, // Assuming movie has a poster_path property
                }
            );
        }
    } catch (error) {
        console.error('Error updating search count:', error);
    }
}

export const getTrendingMovies = async () => {
    try {
        const result = await database.listDocuments(
            DATABASE_ID,
            COLLECTION_ID,
            [Query.orderDesc('count'),
            Query.limit(5) // Limit to the top 5 trending movies
            ],
        );

        return result.documents;
    } catch (error) {
        console.error(error);
    }
}