"use client";

import { useEffect, useState } from "react";

export function useActiveHeading(headings) {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      let current = "";

      headings.forEach((h) => {
        const el = document.getElementById(h.id);
        if (el && el.offsetTop <= window.scrollY + 100) {
          current = h.id;
        }
      });

      setActiveId(current);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [headings]);

  return activeId;
}