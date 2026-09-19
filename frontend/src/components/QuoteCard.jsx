import { Heart } from "lucide-react";

export default function QuoteCard() {
  return (
    <div className="quote-card">
      <img src="https://api.dicebear.com/9.x/pixel-art/svg?seed=quote-hero" alt="" />
      <p>“Great players<br />make a brighter world.”</p>
      <Heart size={25} fill="currentColor" />
    </div>
  );
}