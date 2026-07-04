import { Button } from "@fortifykitchen/ui";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background text-foreground">
      <main className="max-w-xl space-y-6">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Welcome to <span className="text-primary">FortifyKitchen</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Premium meal subscriptions and healthy food ordering. The customer portal workspace is successfully configured.
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="default">Browse Menu</Button>
          <Button variant="outline">Subscribe Now</Button>
        </div>
      </main>
    </div>
  );
}
