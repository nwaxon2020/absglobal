// app/api/news/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'mobile';
  const apiKey = process.env.NEWS_API_KEY;

  const queryMap: Record<string, string> = {
    // Focused on your specific brand list: Oppo, Vivo, Xiaomi, OnePlus + Apple/Samsung
    mobile: '(Oppo OR Vivo OR Xiaomi OR Redmi OR OnePlus OR iPhone OR Samsung) AND smartphone',
    technology: '("artificial intelligence" OR robotics OR "future tech" OR blockchain)',
  };

  const query = encodeURIComponent(queryMap[category]);
  // Fetch a few extra to account for potential duplicates from the provider
  const url = `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&pageSize=15&language=en&apiKey=${apiKey}`;

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    const data = await response.json();
    
    if (!data.articles) return NextResponse.json([]);

    // Logic: Remove duplicates by title and limit to exactly 6
    const uniqueArticles = Array.from(new Map(data.articles.map((a: any) => [a.title, a])).values()).slice(0, 6);

    return NextResponse.json(uniqueArticles);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}