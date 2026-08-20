import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import SplitType from 'split-type';

export default function Landing() {
  const preloaderEl = useRef<HTMLDivElement>(null);
  const preloaderBottomWrapper = useRef<HTMLDivElement>(null);
  const preloaderLineEl = useRef<HTMLDivElement>(null);
  const preloaderLogoWrapper = useRef<HTMLDivElement>(null);
  const preloaderFillLogoEl = useRef<HTMLDivElement>(null);
  const titleElement = useRef<HTMLHeadingElement>(null);
  const contentWrapper = useRef<HTMLDivElement>(null);
  const bgWrapperRef = useRef<HTMLDivElement>(null);

  const [counterText, setCounterText] = useState('0%');

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!bgWrapperRef.current) return;
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 2;
      const y = (e.clientY / innerHeight - 0.5) * 2;
      
      gsap.to(bgWrapperRef.current, {
        x: -x * 30,
        y: -y * 30,
        duration: 1.5,
        ease: 'power2.out',
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    // Prevent scrolling while preloader is active
    document.body.style.overflow = 'hidden';

    let split: SplitType | null = null;

    if (titleElement.current) {
      split = new SplitType(titleElement.current, {
        types: 'words,chars',
      });

      // Initial state for text
      if (split.chars) {
        gsap.set(split.chars, { yPercent: 110 });
      }
      gsap.set(titleElement.current, { opacity: 1, scale: 0.75 });
    }

    const applyHoverEffect = (chars: HTMLElement[]) => {
      chars.forEach((char) => {
        // Prevent double wrapping if already applied
        if (char.querySelector('.char-inner')) return;
        
        const charText = char.innerText;
        char.innerHTML = `<span class="char-inner block relative transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" data-char="${charText}">
          ${charText}
          <span class="absolute top-[100%] left-0 text-[#c4b5fd] block">${charText}</span>
        </span>`;
        // We handle the hover entirely via CSS in the <style> block
      });
    };

    // Session storage check removed so preloader runs on every refresh

    const tl = gsap.timeline({
      paused: true,
      onComplete: () => {
        document.body.style.overflow = '';
      },
    });

    if (preloaderLogoWrapper.current) {
      gsap.set(preloaderLogoWrapper.current, { yPercent: 110 });

      // Step A: Roll up the preloader logo from the bottom
      gsap.to(preloaderLogoWrapper.current, {
        yPercent: 0,
        duration: 1.2,
        ease: 'expo.out',
        onComplete: startLoadingCounter,
      });
    }

    function startLoadingCounter() {
      const counterVal = { val: 0 };
      gsap.to(counterVal, {
        val: 100,
        duration: 3.5,
        ease: 'power1.inOut',
        onUpdate: () => {
          setCounterText(`${Math.round(counterVal.val)}%`);

          if (preloaderFillLogoEl.current) {
            const remaining = 100 - counterVal.val;
            preloaderFillLogoEl.current.style.clipPath = `inset(0 ${remaining}% 0 0)`;
          }

          if (preloaderLineEl.current) {
            preloaderLineEl.current.style.width = `${counterVal.val}%`;
          }
        },
        onComplete: () => {
          tl.play();
        },
      });
    }

    // Phase 1: Preloader Inner Texts Slide Up & Out
    tl.to([preloaderLogoWrapper.current, preloaderBottomWrapper.current], {
      yPercent: -120,
      opacity: 0,
      duration: 0.5,
      ease: 'power3.in',
      stagger: 0.05,
    });

    // Phase 2: Preloader Background Fade
    if (preloaderEl.current) {
      tl.to(
        preloaderEl.current,
        {
          opacity: 0,
          duration: 1.0,
          ease: 'power2.inOut',
          onComplete: () => {
            if (preloaderEl.current) preloaderEl.current.style.display = 'none';
          },
        },
        '-=0.1'
      );
    }

    // Phase 3: The "UNIVORA" Hero Text Reveal
    if (split && split.chars) {
      tl.to(
        split.chars,
        {
          yPercent: 0,
          duration: 1.2,
          stagger: 0.04,
          ease: 'expo.out',
        },
        '-=0.7'
      );

      tl.to(
        titleElement.current,
        {
          scale: 1,
          duration: 0.8,
          ease: 'power2.out',
        },
        '-=1.0'
      );
    }

    // Phase 4: Fade in supporting details and button
    if (contentWrapper.current) {
      tl.fromTo(
        contentWrapper.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 1.0,
          ease: 'power3.out',
          onComplete: () => {
            if (split && split.chars) {
              applyHoverEffect(split.chars);
            }
          }
        },
        '-=0.9'
      );
    }

    return () => {
      // Cleanup SplitType if component unmounts
      if (split) split.revert();
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-transparent overflow-hidden">
      
      {/* Global Style for SplitType Overflow */}
      <style>{`
        .hero-title .word {
          overflow: hidden;
          display: inline-block;
        }
        .hero-title .char {
          display: inline-block;
          will-change: transform;
          overflow: hidden;
          cursor: default;
        }
        .hero-title .char:hover .char-inner {
          transform: translateY(-100%);
        }
      `}</style>

      {/* Preloader Overlay */}
      <div
        ref={preloaderEl}
        className="fixed inset-0 z-[9999] bg-[#8a83d6] backdrop-blur-xl flex flex-col items-center justify-between py-12 px-6 origin-top"
      >
        <div className="h-10"></div>

        <div className="overflow-hidden">
          <div
            ref={preloaderLogoWrapper}
            className="relative text-5xl md:text-7xl tracking-[0.1em] font-medium uppercase select-none"
          >
            <div className="text-white/20">UNIVORA</div>
            <div
              ref={preloaderFillLogoEl}
              className="absolute top-0 left-0 text-white whitespace-nowrap"
              style={{ clipPath: 'inset(0 100% 0 0)' }}
            >
              UNIVORA
            </div>
          </div>
        </div>

        <div
          ref={preloaderBottomWrapper}
          className="flex flex-col items-center gap-3 w-full max-w-[200px] md:max-w-[280px]"
        >
          <div className="w-full h-[2px] bg-white/20 rounded-full overflow-hidden">
            <div ref={preloaderLineEl} className="h-full bg-white w-0"></div>
          </div>
          <div className="flex items-center justify-center gap-2 w-full text-white/80 text-sm md:text-base uppercase tracking-[0.1em] font-medium select-none">
            <span>загружаем...</span>
            <span className="w-10 text-right">{counterText}</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative bg-[#9d8cdb] overflow-hidden">
        
        {/* Background Video */}
        <div ref={bgWrapperRef} className="absolute w-[110%] h-[110%] -top-[5%] -left-[5%] z-0 overflow-hidden pointer-events-none bg-[#9d8cdb]">
          <video
            className="absolute inset-0 h-full w-full object-cover mix-blend-luminosity opacity-90"
            src="https://unfold24.codebydennis.com/assets/video/Unfold_Animation_Loop_0036_Compressed.mp4"
            loop
            muted
            playsInline
            autoPlay
          ></video>
        </div>

        {/* Hero Title */}
        <div className="relative z-10 text-center px-4 w-full flex flex-col items-center justify-center h-full pt-10">
          <h1
            ref={titleElement}
            className="hero-title opacity-0 text-[15vw] sm:text-[14vw] md:text-[13vw] font-bold text-white leading-[0.85] tracking-tight max-w-7xl mx-auto select-none drop-shadow-2xl mix-blend-overlay mb-12"
          >
            Univora
          </h1>
          
          <div ref={contentWrapper} className="opacity-0 translate-y-5 flex flex-col items-center z-20">
            <Link 
              to="/onboarding"
              className="bg-primary hover:bg-violet-600 text-white font-bold py-4 px-12 rounded-full text-lg shadow-[0_0_40px_rgba(139,92,246,0.5)] transition-all transform hover:scale-105 mb-16"
            >
              Начать тест
            </Link>
          </div>
        </div>

        {/* Minimalist Bottom Metadata Row */}
        <div className="absolute bottom-16 md:bottom-20 left-0 w-full z-20 flex justify-between items-center px-8 md:px-16 text-white text-xs md:text-sm font-medium tracking-widest uppercase">
          <span>Математика</span>
          <div className="w-8 h-[2px] bg-white/50 rounded-full hidden md:block"></div>
          <span>Информатика</span>
          <div className="w-2 h-2 bg-white/50 rounded-full hidden md:block"></div>
          <span>История</span>
          <div className="w-8 h-[2px] bg-white/50 rounded-full hidden md:block"></div>
          <span>Биология</span>
        </div>
      </section>
    </div>
  );
}
