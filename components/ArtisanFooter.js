'use client';
export default function ArtisanFooter(){
  return (
    <footer className="bg-terracotta text-cream py-4 text-center">
      <p className="text-sm">© {new Date().getFullYear()} ArtisanAI. All rights reserved.</p>
    </footer>
  );
}
