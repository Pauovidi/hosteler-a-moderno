import { MetadataRoute } from 'next'
import { getAllProducts } from '@/lib/data/products'

const BASE_URL = 'https://v0-personalizados-hosteleria.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
    const products = getAllProducts()

    // Static routes
    const routes = [
        '',
        '/presupuesto',
        // '/blog', // Uncomment when blog is ready
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

    // Blog routes placeholder
    // const blogRoutes = ...

    return [...routes, ...productRoutes]
}
