import Header from "@/components/header";
import Footer from "@/components/footer";

export default function Discover() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Discover</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Explore vault opportunities coming soon.
        </p>
      </main>
      <Footer />
    </div>
  );
}
