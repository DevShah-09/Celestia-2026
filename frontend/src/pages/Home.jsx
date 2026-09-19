import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/homepage.css";

import unicodeLogo from "../assets/homepage/unicode_logo.png";

export default function Home() {
  const navigate = useNavigate();

  const birdWrapperRef = useRef(null);
  const birdWingRef = useRef(null);
  const logoWrapperRef = useRef(null);
  const taglineTopRef = useRef(null);
  const taglineBottomRef = useRef(null);
  const startPlayingBtnRef = useRef(null);

  const slingshotRef = useRef(null);
  const aimingDotsRef = useRef(null);
  const backBandRef = useRef(null);
  const frontBandRef = useRef(null);
  const pouchRef = useRef(null);
  const lightInsectsRef = useRef(null);

  const animationActiveRef = useRef(false);
  const patrolActiveRef = useRef(false);
  const patrolRafRef = useRef(null);
  const wingTimerRef = useRef(null);
  const timersRef = useRef([]);

  useEffect(() => {
    const birdWrapper = birdWrapperRef.current;
    const birdWing = birdWingRef.current;
    const logoWrapper = logoWrapperRef.current;
    const taglineTop = taglineTopRef.current;
    const taglineBottom = taglineBottomRef.current;
    const startPlayingBtn = startPlayingBtnRef.current;

    const slingshot = slingshotRef.current;
    const aimingDots = aimingDotsRef.current;
    const backBand = backBandRef.current;
    const frontBand = frontBandRef.current;
    const pouch = pouchRef.current;
    const lightInsects = lightInsectsRef.current;

    if (!birdWrapper || !logoWrapper || !slingshot) return;

    let wingUp = false;
    let animationActive = false;
    let patrolActive = false;
    let patrolRaf = null;

    /* =========================================
       WING FLAPPING
    ========================================= */

    const startWingFlap = () => {
      if (wingTimerRef.current) {
        clearInterval(wingTimerRef.current);
      }

      wingTimerRef.current = setInterval(() => {
        wingUp = !wingUp;

        if (birdWing) {
          birdWing.setAttribute(
            "class",
            wingUp ? "bird-wing wing-up" : "bird-wing wing-down"
          );
        }
      }, 160);
    };

    startWingFlap();


    /* =========================================
       SPARK PARTICLES
    ========================================= */

    const spawnSpark = (x, y) => {
      const spark = document.createElement("div");

      spark.className = "pixel-spark-particle";

      const symbols = ["✦", "★", "♦", "▪", "🪙"];

      spark.innerText =
        symbols[Math.floor(Math.random() * symbols.length)];

      spark.style.left =
        x - 10 + Math.random() * 20 + "px";

      spark.style.top =
        y + Math.random() * 16 + "px";

      spark.style.setProperty(
        "--dx",
        Math.random() * 30 - 15 + "px"
      );

      spark.style.setProperty(
        "--dy",
        -15 - Math.random() * 30 + "px"
      );

      document.body.appendChild(spark);

      const timer = setTimeout(() => {
        spark.remove();
      }, 700);

      timersRef.current.push(timer);
    };


    /* =========================================
       LOGO CENTER SHIFT
    ========================================= */

    const updateLogoCenterShift = () => {
      const tia = document.querySelector(".logo-word-tia");
      const logo = document.getElementById("celestiaLogo");
      const cont = document.querySelector(".pv-logo-container");

      if (tia && logo && cont) {
        const tiaWidth = tia.offsetWidth;

        const gap =
          parseFloat(window.getComputedStyle(logo).gap) || 12;

        const shift = Math.round(
          (tiaWidth + gap) / 2
        );

        cont.style.setProperty(
          "--logo-center-shift",
          `${shift}px`
        );
      }
    };


    /* =========================================
       SETUP SLINGSHOT
    ========================================= */

    const setupSlingshotPulled = () => {
      updateLogoCenterShift();

      if (patrolRaf) {
        cancelAnimationFrame(patrolRaf);
        patrolRaf = null;
      }

      patrolActive = false;
      patrolActiveRef.current = false;

      animationActive = false;
      animationActiveRef.current = false;

      slingshot.style.display = "block";

      slingshot.classList.remove(
        "slingshot-recoil",
        "fade-out"
      );

      slingshot.classList.add("tension");

      const slingRect =
        slingshot.getBoundingClientRect();

      const pouchX =
        slingRect.left +
        slingRect.width * (-8 / 90);

      const pouchY =
        slingRect.top +
        slingRect.height * (48 / 140);

      const birdWidth =
        birdWrapper.offsetWidth || 75;

      const birdHeight =
        birdWrapper.offsetHeight || 70;

      birdWrapper.style.left =
        Math.max(
          12,
          Math.round(
            pouchX - birdWidth * 0.30
          )
        ) + "px";

      birdWrapper.style.top =
        Math.round(
          pouchY - birdHeight * 0.48
        ) + "px";

      birdWrapper.style.transform =
        "rotate(-14deg) scale(1)";

      birdWrapper.style.opacity = "1";


      /* Reset rubber bands */

      if (backBand) {
        backBand.setAttribute(
          "d",
          "M 18 27 Q 6 36, -8 48"
        );
      }

      if (frontBand) {
        frontBand.setAttribute(
          "d",
          "M 65 35 Q 26 42, -8 48"
        );
      }

      if (pouch) {
        pouch.setAttribute(
          "d",
          "M -14 36 C -20 44, -20 54, -14 62 C -8 58, -6 40, -14 36 Z"
        );
      }

      if (aimingDots) {
        aimingDots.style.opacity = "0.9";
      }


      /* Reset logo */

      logoWrapper.classList.remove(
        "revealed-complete"
      );

      logoWrapper.style.setProperty(
        "--reveal-pct",
        "0%"
      );

      taglineBottom?.classList.remove("revealed");

      startPlayingBtn?.classList.remove("revealed");
    };


    /* =========================================
       BIRD PATROL
    ========================================= */

    const startBirdPatrol = () => {
      if (patrolActive) return;

      patrolActive = true;
      patrolActiveRef.current = true;

      let direction = -1;

      let startX =
        parseFloat(birdWrapper.style.left) ||
        window.innerWidth - 80;

      let endX = -130;

      let durationMs = Math.max(
        4500,
        window.innerWidth * 5.5
      );

      let baseAltitude = Math.max(
        45,
        window.innerHeight * 0.15
      );

      let startTime = performance.now();


      const patrolFrame = (now) => {
        if (!patrolActive) return;

        const elapsed = now - startTime;

        const progress = Math.min(
          1,
          elapsed / durationMs
        );

        const currentX =
          startX +
          (endX - startX) * progress;

        const wave =
          Math.sin(
            progress * Math.PI * 2
          ) * 20;

        const currentY =
          baseAltitude + wave;

        birdWrapper.style.left =
          currentX + "px";

        birdWrapper.style.top =
          currentY + "px";


        /* Face flight direction */

        birdWrapper.style.transform =
          direction === -1
            ? "scaleX(-1)"
            : "scaleX(1)";


        if (progress < 1) {
          patrolRaf =
            requestAnimationFrame(
              patrolFrame
            );

          patrolRafRef.current =
            patrolRaf;
        } else {

          direction =
            direction === -1 ? 1 : -1;

          if (direction === 1) {

            startX = -130;

            endX =
              window.innerWidth + 130;

            baseAltitude =
              Math.max(
                45,
                window.innerHeight *
                  (0.11 + Math.random() * 0.08)
              );

            durationMs =
              Math.max(
                4500,
                window.innerWidth *
                  (4.5 + Math.random() * 2)
              );

          } else {

            startX =
              window.innerWidth + 130;

            endX = -130;

            baseAltitude =
              Math.max(
                45,
                window.innerHeight *
                  (0.10 + Math.random() * 0.08)
              );

            durationMs =
              Math.max(
                4500,
                window.innerWidth *
                  (4.5 + Math.random() * 2)
              );
          }

          startTime = performance.now();

          patrolRaf =
            requestAnimationFrame(
              patrolFrame
            );

          patrolRafRef.current =
            patrolRaf;
        }
      };

      patrolRaf =
        requestAnimationFrame(
          patrolFrame
        );

      patrolRafRef.current =
        patrolRaf;
    };


    /* =========================================
       LAUNCH BIRD
    ========================================= */

    const launchBirdFromSlingshot = () => {

      if (animationActive) return;

      animationActive = true;
      animationActiveRef.current = true;

      if (patrolRaf) {
        cancelAnimationFrame(patrolRaf);
        patrolRaf = null;
      }

      patrolActive = false;
      patrolActiveRef.current = false;


      /* Rubber bands snap */

      if (backBand) {
        backBand.setAttribute(
          "d",
          "M 18 27 Q 28 42, 38 78"
        );
      }

      if (frontBand) {
        frontBand.setAttribute(
          "d",
          "M 65 35 Q 56 46, 44 78"
        );
      }

      if (pouch) {
        pouch.setAttribute(
          "d",
          "M 36 68 C 34 72, 34 76, 36 80 C 42 80, 42 68, 36 68 Z"
        );
      }

      if (aimingDots) {
        aimingDots.style.opacity = "0";
      }

      slingshot.classList.remove("tension");
      slingshot.classList.add(
        "slingshot-recoil"
      );


      /* Starting position */

      const startX =
        parseFloat(birdWrapper.style.left);

      const startY =
        parseFloat(birdWrapper.style.top);


      /* Logo measurements */

      const logoRect =
        logoWrapper.getBoundingClientRect();

      const tagRect =
        taglineTop?.getBoundingClientRect();

      const topCeilingY =
        tagRect
          ? tagRect.top
          : logoRect.top - 50;


      /* Bezier points */

      const P0 = {
        x: startX,
        y: startY
      };

      const apexX =
        P0.x +
        (
          logoRect.left +
          logoRect.width * 0.45 -
          P0.x
        ) * 0.72;

      const apexY =
        Math.min(
          P0.y - 70,
          topCeilingY -
            Math.max(
              38,
              window.innerHeight * 0.07
            )
        );

      const P1 = {
        x: apexX,
        y: Math.max(12, apexY)
      };

      const P2 = {
        x: window.innerWidth + 140,
        y: Math.max(
          20,
          topCeilingY - 12
        )
      };


      /* Same 2300ms flight */

      const durationMs = 2300;

      const startTime =
        performance.now();

      let slingshotDisappeared = false;


      const flightFrame = (now) => {

        const elapsed =
          now - startTime;

        const progress =
          Math.min(
            1,
            elapsed / durationMs
          );

        const t = progress;
        const omt = 1 - t;


        /* Quadratic Bezier */

        const currentX =
          omt * omt * P0.x +
          2 * omt * t * P1.x +
          t * t * P2.x;

        const currentY =
          omt * omt * P0.y +
          2 * omt * t * P1.y +
          t * t * P2.y;


        /* Tangent */

        const dx =
          2 * omt * (P1.x - P0.x) +
          2 * t * (P2.x - P1.x);

        const dy =
          2 * omt * (P1.y - P0.y) +
          2 * t * (P2.y - P1.y);

        const angleDeg =
          Math.atan2(dy, dx) *
          (180 / Math.PI);


        birdWrapper.style.left =
          currentX + "px";

        birdWrapper.style.top =
          currentY + "px";

        birdWrapper.style.transform =
          `rotate(${angleDeg.toFixed(1)}deg) scale(1)`;


        /* =====================================
           LOGO REVEAL
        ===================================== */

        const birdWidth =
          birdWrapper.offsetWidth || 75;

        const birdHeight =
          birdWrapper.offsetHeight || 70;

        const birdBeakX =
          currentX +
          birdWidth * 0.85;

        const logoLeft =
          logoRect.left;

        const logoRight =
          logoRect.right;

        const logoWidth =
          logoRect.width;


        if (birdBeakX >= logoLeft) {

          const rawPct =
            Math.min(
              100,
              Math.max(
                0,
                (
                  (birdBeakX - logoLeft) /
                  logoWidth
                ) * 100
              )
            );

          const pixelStepPct =
            Math.min(
              100,
              Math.floor(rawPct / 3) * 3
            );

          logoWrapper.style.setProperty(
            "--reveal-pct",
            pixelStepPct + "%"
          );


          if (
            rawPct < 100 &&
            Math.random() < 0.75
          ) {
            spawnSpark(
              birdBeakX,
              currentY +
                birdHeight * 0.65
            );
          }
        }


        /* =====================================
           SLINGSHOT DISAPPEARS
        ===================================== */

        if (
          !slingshotDisappeared &&
          (
            birdBeakX >= logoRight + 15 ||
            (
              birdBeakX >= logoLeft &&
              (
                (birdBeakX - logoLeft) /
                logoWidth
              ) >= 0.98
            )
          )
        ) {

          slingshotDisappeared = true;

          logoWrapper.classList.add(
            "revealed-complete"
          );

          logoWrapper.style.setProperty(
            "--reveal-pct",
            "100%"
          );

          slingshot.classList.add(
            "fade-out"
          );

          const timer = setTimeout(() => {
            slingshot.style.display = "none";
          }, 600);

          timersRef.current.push(timer);
        }


        /* =====================================
           CONTINUE FLIGHT
        ===================================== */

        if (
          progress < 1 &&
          currentX < window.innerWidth + 80
        ) {

          requestAnimationFrame(
            flightFrame
          );

        } else {

          birdWrapper.style.left =
            window.innerWidth + 140 + "px";

          animationActive = false;
          animationActiveRef.current = false;


          logoWrapper.classList.add(
            "revealed-complete"
          );

          logoWrapper.style.setProperty(
            "--reveal-pct",
            "100%"
          );


          taglineBottom?.classList.add(
            "revealed"
          );

          startPlayingBtn?.classList.add(
            "revealed"
          );


          /* Start ambient patrol */

          const timer = setTimeout(
            startBirdPatrol,
            1200
          );

          timersRef.current.push(timer);
        }
      };


      requestAnimationFrame(
        flightFrame
      );
    };


    /* =========================================
       INTRO
    ========================================= */

    const triggerIntroAnimation = () => {

      setupSlingshotPulled();

      const timer = setTimeout(
        launchBirdFromSlingshot,
        800
      );

      timersRef.current.push(timer);
    };


    /* =========================================
       BIRD BOOST
    ========================================= */

    const boostBird = () => {

      birdWrapper.classList.add("boost");

      const curX =
        parseFloat(
          birdWrapper.style.left
        ) ||
        window.innerWidth * 0.5;

      const curY =
        parseFloat(
          birdWrapper.style.top
        ) ||
        window.innerHeight * 0.15;


      for (let i = 0; i < 7; i++) {
        spawnSpark(
          curX + 35,
          curY + 25
        );
      }


      const timer = setTimeout(() => {
        birdWrapper.classList.remove(
          "boost"
        );
      }, 700);

      timersRef.current.push(timer);
    };


    /* =========================================
       FIREFLIES
    ========================================= */

    const initLightInsects = () => {

      if (!lightInsects) return;

      const count = 16;

      for (let i = 0; i < count; i++) {

        const insect =
          document.createElement("div");

        insect.className =
          "light-insect";

        insect.style.left =
          Math.random() * 92 + 4 + "%";

        insect.style.top =
          Math.random() * 70 + 15 + "%";

        insect.style.animationDelay =
          Math.random() * 4 +
          "s, " +
          Math.random() * 6 +
          "s";

        insect.style.setProperty(
          "--drift-time",
          7 + Math.random() * 7 + "s"
        );

        insect.style.setProperty(
          "--dx1",
          Math.random() * 50 - 25 + "px"
        );

        insect.style.setProperty(
          "--dy1",
          Math.random() * -40 - 10 + "px"
        );

        insect.style.setProperty(
          "--dx2",
          Math.random() * 60 - 30 + "px"
        );

        insect.style.setProperty(
          "--dy2",
          Math.random() * 30 - 15 + "px"
        );

        insect.style.setProperty(
          "--dx3",
          Math.random() * 50 - 25 + "px"
        );

        insect.style.setProperty(
          "--dy3",
          Math.random() * -30 - 10 + "px"
        );

        const sz =
          3 + Math.random() * 2.5;

        insect.style.width =
          sz + "px";

        insect.style.height =
          sz + "px";

        lightInsects.appendChild(
          insect
        );
      }
    };


    /* =========================================
       RESIZE
    ========================================= */

    const handleResize = () => {

      updateLogoCenterShift();

      if (
        logoWrapper.classList.contains(
          "revealed-complete"
        )
      ) {

        logoWrapper.style.setProperty(
          "--reveal-pct",
          "100%"
        );

      } else if (!animationActive) {

        setupSlingshotPulled();
      }
    };


    /* =========================================
       CLICK BIRD
    ========================================= */

    birdWrapper.addEventListener(
      "click",
      boostBird
    );


    /* =========================================
       INITIALIZE
    ========================================= */

    initLightInsects();

    updateLogoCenterShift();

    triggerIntroAnimation();

    window.addEventListener(
      "resize",
      handleResize
    );


    /* =========================================
       CLEANUP
    ========================================= */

    return () => {

      if (wingTimerRef.current) {
        clearInterval(
          wingTimerRef.current
        );
      }

      if (patrolRaf) {
        cancelAnimationFrame(
          patrolRaf
        );
      }

      if (patrolRafRef.current) {
        cancelAnimationFrame(
          patrolRafRef.current
        );
      }

      timersRef.current.forEach(
        (timer) => clearTimeout(timer)
      );

      timersRef.current = [];

      window.removeEventListener(
        "resize",
        handleResize
      );

      birdWrapper.removeEventListener(
        "click",
        boostBird
      );

      lightInsects.innerHTML = "";
    };

  }, []);


  return (
    <div className="celestia-world">

      {/* SUN */}

      <div className="sun-shining-rays"></div>

      <div className="sun-glow-overlay"></div>


      {/* FIREFLIES */}

      <div
        ref={lightInsectsRef}
        className="light-insects-container"
      ></div>


      {/* DJS UNICODE LOGO */}

      <div
        className="pv-top-logo"
        title="DJS Unicode"
      >
        <img
          src={unicodeLogo}
          alt="DJS Unicode"
          className="pv-top-logo-img"
        />
      </div>


      {/* =====================================
          SLINGSHOT
      ===================================== */}

      <div
        ref={slingshotRef}
        className="pv-slingshot-container tension"
      >

        <div
          ref={aimingDotsRef}
          className="pv-aiming-dots"
        >

          <div className="pv-aiming-dot"></div>
          <div className="pv-aiming-dot"></div>
          <div className="pv-aiming-dot"></div>
          <div className="pv-aiming-dot"></div>

        </div>


        <svg
          className="pv-slingshot-svg"
          viewBox="0 0 90 140"
          xmlns="http://www.w3.org/2000/svg"
        >

          <defs>

            <linearGradient
              id="woodBarkGrad"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop
                offset="0%"
                stopColor="#3d1e08"
              />
              <stop
                offset="35%"
                stopColor="#6b3710"
              />
              <stop
                offset="70%"
                stopColor="#8c4b1a"
              />
              <stop
                offset="100%"
                stopColor="#4d2408"
              />
            </linearGradient>

          </defs>


          {/* Back Prong */}

          <path
            d="M 38 78 C 30 70, 20 54, 16 28 C 22 28, 25 36, 32 50 C 36 58, 40 70, 42 75 Z"
            fill="url(#woodBarkGrad)"
            stroke="#1a0c04"
            strokeWidth="2"
          />

          <ellipse
            cx="18"
            cy="27"
            rx="4.5"
            ry="3.5"
            fill="#4d2408"
            stroke="#1a0c04"
            strokeWidth="1.5"
          />


          {/* Back Rubber Band */}

          <path
            ref={backBandRef}
            d="M 18 27 Q 6 36, -8 48"
            stroke="#681b1b"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />


          {/* Front Fork */}

          <g>

            <path
              d="M 33 140 L 35 78 C 38 74, 44 74, 47 78 L 49 140 Z"
              fill="url(#woodBarkGrad)"
              stroke="#1a0c04"
              strokeWidth="2"
            />

            <ellipse
              cx="41"
              cy="98"
              rx="3.5"
              ry="5.5"
              fill="#2d1405"
            />

            <line
              x1="39"
              y1="112"
              x2="39"
              y2="128"
              stroke="#2d1405"
              strokeWidth="1.5"
            />

            <line
              x1="44"
              y1="84"
              x2="44"
              y2="104"
              stroke="#a15b22"
              strokeWidth="1.5"
              opacity="0.6"
            />


            <path
              d="M 43 78 C 50 68, 58 52, 64 34 C 70 36, 68 44, 60 58 C 54 68, 48 76, 46 80 Z"
              fill="url(#woodBarkGrad)"
              stroke="#1a0c04"
              strokeWidth="2"
            />

            <ellipse
              cx="65"
              cy="35"
              rx="4.5"
              ry="3.5"
              fill="#522b0d"
              stroke="#1a0c04"
              strokeWidth="1.5"
            />

          </g>


          {/* Front Rubber Band */}

          <path
            ref={frontBandRef}
            d="M 65 35 Q 26 42, -8 48"
            stroke="#852222"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />


          {/* Leather Pouch */}

          <path
            ref={pouchRef}
            d="M -14 36 C -20 44, -20 54, -14 62 C -8 58, -6 40, -14 36 Z"
            fill="#26180c"
            stroke="#120c06"
            strokeWidth="2"
          />

        </svg>

      </div>


      {/* =====================================
          ANGRY BIRD
      ===================================== */}

      <div
        ref={birdWrapperRef}
        className="pv-angry-bird-wrapper"
        title="Click the Angry Bird for a speed boost!"
      >

        <div className="angry-bird-trail">
          <span className="trail-line line-1"></span>
          <span className="trail-line line-2"></span>
          <span className="trail-line line-3"></span>
        </div>


        <svg
          className="pv-angry-bird-svg"
          viewBox="0 0 120 110"
          width="85"
          height="78"
          xmlns="http://www.w3.org/2000/svg"
        >

          <defs>

            <radialGradient
              id="birdBodyGrad"
              cx="38%"
              cy="32%"
              r="68%"
            >
              <stop
                offset="0%"
                stopColor="#ff4d4d"
              />
              <stop
                offset="45%"
                stopColor="#e11d27"
              />
              <stop
                offset="80%"
                stopColor="#ab0e17"
              />
              <stop
                offset="100%"
                stopColor="#6e050b"
              />
            </radialGradient>


            <linearGradient
              id="birdBellyGrad"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor="#fdf4dc"
              />
              <stop
                offset="70%"
                stopColor="#f3dba3"
              />
              <stop
                offset="100%"
                stopColor="#deb474"
              />
            </linearGradient>


            <linearGradient
              id="beakTopGrad"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="50%"
            >
              <stop
                offset="0%"
                stopColor="#ffc83b"
              />
              <stop
                offset="60%"
                stopColor="#f59e0b"
              />
              <stop
                offset="100%"
                stopColor="#d97706"
              />
            </linearGradient>


            <linearGradient
              id="beakBottomGrad"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="50%"
            >
              <stop
                offset="0%"
                stopColor="#e68a00"
              />
              <stop
                offset="100%"
                stopColor="#b45309"
              />
            </linearGradient>

          </defs>


          {/* Tail */}

          <g>
            <path
              d="M 12 50 C 2 46, -4 40, -6 32 C -2 38, 8 46, 16 48 Z"
              fill="#18181b"
              stroke="#09090b"
              strokeWidth="1.5"
            />

            <path
              d="M 14 56 C 2 54, -8 50, -10 42 C -4 48, 6 52, 18 54 Z"
              fill="#27272a"
              stroke="#09090b"
              strokeWidth="1.5"
            />

            <path
              d="M 16 62 C 4 64, -6 66, -8 56 C -2 60, 8 60, 20 60 Z"
              fill="#18181b"
              stroke="#09090b"
              strokeWidth="1.5"
            />
          </g>


          {/* Crest */}

          <g>
            <path
              d="M 52 18 C 42 4, 30 2, 22 8 C 28 14, 40 16, 56 22 Z"
              fill="#991b1b"
              stroke="#450a0a"
              strokeWidth="1.5"
            />

            <path
              d="M 62 18 C 54 2, 42 0, 32 6 C 38 14, 50 16, 66 22 Z"
              fill="#dc2626"
              stroke="#450a0a"
              strokeWidth="1.5"
            />
          </g>


          {/* Body */}

          <circle
            cx="68"
            cy="58"
            r="42"
            fill="url(#birdBodyGrad)"
            stroke="#3b0709"
            strokeWidth="2.5"
          />


          {/* Belly */}

          <path
            d="M 44 72 C 48 88, 62 98, 76 98 C 90 98, 102 88, 104 74 C 94 68, 80 66, 68 68 C 56 68, 48 70, 44 72 Z"
            fill="url(#birdBellyGrad)"
            stroke="#a16207"
            strokeWidth="1.5"
          />

          <circle
            cx="48"
            cy="62"
            r="2.2"
            fill="#7f1d1d"
            opacity="0.6"
          />

          <circle
            cx="53"
            cy="66"
            r="1.8"
            fill="#7f1d1d"
            opacity="0.6"
          />

          <circle
            cx="45"
            cy="67"
            r="1.5"
            fill="#7f1d1d"
            opacity="0.5"
          />


          {/* Eyes */}

          <ellipse
            cx="76"
            cy="49"
            rx="10"
            ry="11"
            fill="#ffffff"
            stroke="#262626"
            strokeWidth="2"
          />

          <ellipse
            cx="79"
            cy="49"
            rx="4.5"
            ry="5.5"
            fill="#09090b"
          />

          <circle
            cx="81"
            cy="47"
            r="1.8"
            fill="#ffffff"
          />

          <circle
            cx="78"
            cy="52"
            r="0.8"
            fill="#ffffff"
          />


          <ellipse
            cx="95"
            cy="49"
            rx="10"
            ry="11"
            fill="#ffffff"
            stroke="#262626"
            strokeWidth="2"
          />

          <ellipse
            cx="97"
            cy="49"
            rx="4.5"
            ry="5.5"
            fill="#09090b"
          />

          <circle
            cx="99"
            cy="47"
            r="1.8"
            fill="#ffffff"
          />

          <circle
            cx="96"
            cy="52"
            r="0.8"
            fill="#ffffff"
          />


          {/* Eyebrows */}

          <path
            d="M 62 38 L 86 46 L 86 37 L 62 31 Z"
            fill="#18181b"
            stroke="#000000"
            strokeWidth="1.5"
          />

          <path
            d="M 86 46 L 110 38 L 110 31 L 86 37 Z"
            fill="#18181b"
            stroke="#000000"
            strokeWidth="1.5"
          />

          <polygon
            points="83,36 89,36 87,47 85,47"
            fill="#18181b"
          />


          {/* Beak */}

          <path
            d="M 82 53 Q 106 58 112 60 Q 94 67 82 66 Z"
            fill="url(#beakTopGrad)"
            stroke="#78350f"
            strokeWidth="1.5"
          />

          <ellipse
            cx="87"
            cy="56"
            rx="1.2"
            ry="0.8"
            fill="#78350f"
          />

          <path
            d="M 83 66 Q 98 67 106 60 Q 94 72 83 71 Z"
            fill="url(#beakBottomGrad)"
            stroke="#78350f"
            strokeWidth="1.5"
          />


          {/* Wing */}

          <g
            ref={birdWingRef}
            className="bird-wing"
          >
            <path
              d="M 46 64 C 40 54, 30 56, 32 68 C 34 76, 46 78, 52 70 C 50 67, 48 65, 46 64 Z"
              fill="#b91c1c"
              stroke="#450a0a"
              strokeWidth="2"
            />
          </g>

        </svg>

      </div>


      {/* =====================================
          MAIN HERO
      ===================================== */}

      <main className="pv-main-stage">

        <div className="pv-hero-center">

          {/* Top tagline */}

          <div
            ref={taglineTopRef}
            className="pv-hero-tagline-top"
          >
            <div className="tagline-brand">
              DJS UNICODE
            </div>

            <div className="tagline-presents">
              ---- PRESENTS ----
            </div>
          </div>


          {/* CELESTIA LOGO */}

          <div className="pv-logo-container">

            <div
              ref={logoWrapperRef}
              className="pv-3d-logo-wrapper"
            >

              <h1
                id="celestiaLogo"
                className="pv-3d-logo"
              >

                <span className="logo-word-celes">
                  CELESTIA
                </span>

                <span className="logo-word-tia">
                  4.0
                </span>

              </h1>

            </div>

          </div>


          {/* Bottom tagline */}

          <div
            ref={taglineBottomRef}
            className="pv-hero-tagline-bottom"
          >

            <div className="tagline-topic">
              GAME ON
            </div>

            <div className="tagline-motto">
              PLAY • CLASH • WIN
            </div>

          </div>


          {/* Start button */}

          <button
            ref={startPlayingBtnRef}
            className="pv-btn-start-playing"
            onClick={() => navigate("/leaderboard")}
          >

            <span>
              START PLAYING
            </span>

            <span className="pixel-arrow">
              ▶
            </span>

          </button>

        </div>

      </main>

    </div>
  );
}