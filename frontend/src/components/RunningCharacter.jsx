import { useEffect, useState } from "react";

import leftSprite from "../assets/images/left.png";
import rightSprite from "../assets/images/right.png";

export default function RunningCharacter({ side }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((currentFrame) => {
        if (currentFrame === 7) {
          return 0;
        }

        return currentFrame + 1;
      });
    }, 100); // CHANGE SPEED HERE

    return () => {
      clearInterval(interval);
    };
  }, []);

  const spriteImage = side === "left" ? leftSprite : rightSprite;

  return (
    <div
      className={`running-character ${side}`}
      style={{
        backgroundImage: `url(${spriteImage})`,
        backgroundPosition: `-${frame * 157}px 0px`,
      }}
    />
  );
}