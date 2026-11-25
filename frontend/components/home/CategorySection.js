'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function CategorySection({ categories = [] }) {
  return (
    <section className="container-page py-16 lg:py-20 border-t hairline">
      <div className="flex items-end justify-between mb-10">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-display text-3xl sm:text-4xl text-brown"
        >
          Shop by craft
        </motion.h2>
        <Link href="/shop" className="hidden sm:block text-sm text-terracotta hover:underline underline-offset-4">
          View all crafts
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 sm:gap-5">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.slug}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: (i % 7) * 0.05 }}
          >
            <Link href={`/shop?category=${cat.slug}`} className="group block text-center">
              <div className="relative aspect-square rounded-full overflow-hidden border hairline">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="140px"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <p className="text-sm text-brown/80 mt-3 group-hover:text-terracotta transition-colors">{cat.name}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
