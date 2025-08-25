export async function searchGoogleBooks(query: string) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.items) return [];
  return data.items.map((item: any) => ({
    id: item.id,
    title: item.volumeInfo.title,
    authors: item.volumeInfo.authors?.join(', ') ?? '',
    description: item.volumeInfo.description ?? '',
    publishedDate: item.volumeInfo.publishedDate ?? '',
    cover: item.volumeInfo.imageLinks?.thumbnail ?? '',
    infoLink: item.volumeInfo.infoLink ?? '',
    categories: item.volumeInfo.categories ?? [],
    isbn: item.volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier ?? '',
  }));
}

export async function getGoogleBookDetails(volumeId: string) {
  const res = await fetch(`https://www.googleapis.com/books/v1/volumes/${volumeId}`);
  return res.json();
}
