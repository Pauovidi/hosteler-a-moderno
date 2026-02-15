import { MetadataRoute } from 'next'
import { getAllProducts } from '@/lib/data/products'
import { getAllPosts } from '@/lib/data/blog'

const BASE_URL = 'https://v0-personalizados-hosteleria.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
    const products = getAllProducts()
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
        url: `${BASE_URL}/producto/${product.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }))

    const blogRoutes = posts.map((post) => ({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: new Date(post.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }))

    return [...routes, ...productRoutes, ...blogRoutes]
}
