import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

import Markdown from 'react-markdown'

interface TypewriterProps {
    animatedText: string;
    className?: string;
    cursorClassName?: string;
    typingSpeed?: number; // Added a prop to control typing speed
    animationCallback: () => void; // Added a prop to call a function when the animation is complete
    currentMessageKey: string;
  }
  
  const Typewriter = ({
    animatedText,
    className,
    cursorClassName,
    typingSpeed = 5, // Default typing speed (ms per character)
    animationCallback = () => {},
    currentMessageKey
  }: TypewriterProps) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);


    useEffect(() => {
      console.log("Reset for new message")
      setDisplayedText('');
      setCurrentIndex(0);
    }, [currentMessageKey]);

    useEffect(() => {

      if (currentIndex < animatedText.length) {
        setIsAnimating(true);
        const nextChar = animatedText[currentIndex];
        const timer = setTimeout(() => {
          setDisplayedText((prev) => prev + nextChar);
          animationCallback()
          setCurrentIndex((prevIndex) => prevIndex + 1);
        }, typingSpeed); // Adjust typing speed based on the prop
  
        return () => clearTimeout(timer); // Clear timeout on unmount or if text changes
      } else {
        setIsAnimating(false);
      }
    }, [animatedText, currentIndex, typingSpeed]);
  
    return (
      <div
        className={cn(
          'text-left prose prose-sm prose-blue max-w-none [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1 [&_p]:my-2',
          className
        )}
      >
        <Markdown
          components={{
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                {children}
              </a>
            ),
          }}
        >
          {displayedText}
        </Markdown>
        {isAnimating && (
          <motion.span
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            className={cn(
              'inline-block rounded-sm w-[4px] h-4 md:h-6 lg:h-10 bg-blue-500',
              cursorClassName
            )}
          ></motion.span>
        )}
      </div>
    );
  };
  
  export default Typewriter;