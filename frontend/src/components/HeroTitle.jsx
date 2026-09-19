import { useEffect, useState } from "react";

const letters = [
  { char: "L", type: "leader" },
  { char: "E", type: "leader" },
  { char: "A", type: "leader" },
  { char: "D", type: "leader" },
  { char: "E", type: "leader" },
  { char: "R", type: "leader" },

  { char: "B", type: "board" },
  { char: "O", type: "board" },
  { char: "A", type: "board" },
  { char: "R", type: "board" },
  { char: "D", type: "board" },
];

export default function HeroTitle() {
  const [visibleLetters, setVisibleLetters] = useState(0);
  const [animationFinished, setAnimationFinished] = useState(false);

  useEffect(() => {
    setVisibleLetters(0);
    setAnimationFinished(false);

    const interval = setInterval(() => {
      setVisibleLetters((current) => {
        if (current >= letters.length) {
          clearInterval(interval);
          setAnimationFinished(true);
          return current;
        }

        return current + 1;
      });
    }, 200);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="hero-title">
      <div className="leaderboard-title">

        <div className="title-letters">
          {letters.map((item, index) => (
            <span
              key={index}
              className={`title-letter ${item.type} ${
                index < visibleLetters ? "visible" : ""
              }`}
            >
              {item.char}
            </span>
          ))}
        </div>

        <span
          className={`title-crown ${
            animationFinished ? "visible" : ""
          }`}
        >
          ♛
        </span>

        {!animationFinished && (
          <span
            className="pacman"
            style={{
              left: `${visibleLetters * 8.8}%`,
            }}
          />
        )}

      </div>
    </div>
  );
}