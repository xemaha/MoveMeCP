// Script: enrich-books-with-google-books.ts
// Ergänzt fehlende Buchfelder in der Supabase-Datenbank per Google Books API

import { createClient } from '@supabase/supabase-js';
import { searchGoogleBooks } from '../src/lib/googleBooksApi';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function enrichBooks() {
  // Hole alle Bücher mit fehlenden Feldern
  const { data: books, error } = await supabase
    .from('books')
    .select('*');
  if (error) throw error;

  for (const book of books) {
    // Prüfe, ob Felder fehlen
    if (!book.description || !book.author || !book.year || !book.cover) {
      // Suche per Google Books API
      const results = await searchGoogleBooks(book.title);
      if (results.length === 0) continue;
      const match = results[0];
      // Update Buch in DB
      await supabase
        .from('books')
        .update({
          description: book.description || match.description,
          author: book.author || match.authors,
          year: book.year || (match.publishedDate ? match.publishedDate.slice(0, 4) : null),
          cover: book.cover || match.cover,
        })
        .eq('id', book.id);
      console.log(`Buch aktualisiert: ${book.title}`);
    }
  }
  console.log('Fertig!');
}

// Ausführen
enrichBooks().catch(console.error);
