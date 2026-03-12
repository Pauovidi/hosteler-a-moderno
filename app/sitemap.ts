import { MetadataRoute } from 'next'
import { getAllProducts, getCanonicalProductPath } from '@/lib/content/products-store'
import { getAllPosts } from '@/lib/data/blog'

const BASE_URL = 'https://v0-personalizados-hosteleria.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const products = await getAllProducts()
    const posts = getAllPosts()

    // Static routes
    const routes = [
        '',
        '/presupuesto',
        '/blog',
    ].map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    // Product routes
    const productRoutes = products.map((product) => ({
        url: `${BASE_URL}${getCanonicalProductPath(product)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }))

    const blogRoutes = posts.map((post) => ({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }))

    return [...routes, ...productRoutes, ...blogRoutes]
}
