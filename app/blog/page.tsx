import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getAllPosts } from "@/lib/data/blog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "Blog | Personalizados Hosteleria",
    description: "Noticias, consejos y tendencias sobre el sector HORECA y personalización de productos.",
};

export default function BlogPage() {
    const posts = getAllPosts();

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 pt-32 pb-20 container mx-auto px-4">
                <h1 className="text-4xl font-display text-foreground mb-12 text-center">Blog y Noticias</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map((post) => (
                        <Card key={post.slug} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="font-display text-xl">{post.title}</CardTitle>
                                <CardDescription>{post.date} | Por {post.author}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <p className="text-muted-foreground">{post.excerpt}</p>
                            </CardContent>
                            <CardFooter>
                                <Link href={`/blog/${post.slug}`} className="w-full">
                                    <Button variant="outline" className="w-full">Leer más</Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </main>
            <Footer />
        </div>
    );
}
