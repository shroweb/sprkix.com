"use client";

import { useState } from "react";
import Image from "next/image";

interface EventPosterProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
}

export default function EventPoster({ src, alt, className = "" }: EventPosterProps) {
  const [errored, setErrored] = useState(false);
  const imgSrc = !src || errored ? "/placeholder.png" : src;

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      className={`object-cover group-hover:scale-105 transition-transform duration-700 ${className}`}
      onError={() => setErrored(true)}
    />
  );
}
