export async function searchGoogleBooks(query: string) {
  const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`);
  const data = await res.json();
  return data.items || [];
}

export async function getGoogleBookDetails(volumeId: string) {
  const res = await fetch(`https://www.googleapis.com/books/v1/volumes/${volumeId}`);
  return res.json();
}
