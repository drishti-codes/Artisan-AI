'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function OurStory() {
  return (
    <section className="border-t hairline">
      <div className="container-page py-16 lg:py-20 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative aspect-[4/3] rounded-sm overflow-hidden order-2 lg:order-1"
        >
          <Image
            src="/images/site/our-story.svg"
            alt="Artisan weaving at a loom"
            fill
            sizes="(max-width: 1024px) 90vw, 45vw"
            className="object-cover"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="order-1 lg:order-2"
        >
          <p className="text-terracotta text-sm mb-4 tracking-wide">Our Story</p>
          <h2 className="font-display text-3xl sm:text-4xl text-brown leading-tight text-balance">
            More than a marketplace.
            <br />
            <span className="italic">It's a movement.</span>
          </h2>
          <p className="mt-5 text-brown/70 leading-relaxed max-w-md">
            ArtisanAI connects passionate global buyers with talented local artisans — using
            technology not to replace craft, but to help it travel further than it ever could
            on its own.
          </p>
          <Link href="/about" className="inline-block mt-6 btn-outline text-sm px-6 py-3 rounded-full">
            Know more
          </Link>

          <div className="grid grid-cols-2 gap-6 mt-10 max-w-sm">
            {[
              ['500+', 'Artisans'],
              ['10,000+', 'Products'],
              ['20+', 'States & Regions'],
              ['100%', 'Authentic & Verified'],
            ].map(([num, label]) => (
              <div key={label}>
                <p className="font-display text-2xl text-forest">{num}</p>
                <p className="text-xs text-brown/55 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
