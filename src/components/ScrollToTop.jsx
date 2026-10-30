import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Ensures that whenever the route pathname or params change,
 * the page automatically scrolls to the very top (0, 0).
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [pathname]);

  return null;
}

