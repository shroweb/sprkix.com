"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import ShareReviewModal from "./ShareReviewModal";

interface ShareReviewButtonProps {
  review: {
    rating: number;
    comment: string | null;
  };
  event: {
    title: string;
    posterUrl: string | null;
    promotion: string;
  };
  className?: string;
}

export default function ShareReviewButton({
  review,
  event,
  className,
}: ShareReviewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={className || "p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-primary"}
        title="Share review to story"
      >
        <Share2 className="w-4 h-4" />
      </button>

      <ShareReviewModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        review={review}
        event={event}
      />
    </>
  );
}
