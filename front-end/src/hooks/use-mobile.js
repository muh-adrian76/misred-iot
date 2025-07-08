import * as React from "react"


export function useBreakpoint() {
  const getStatus = () => {
    const width = typeof window !== "undefined" ? window.innerWidth : 1200;
    return {
      isMobile: width < 640,
      isTablet: width >= 640 && width < 1024,
      isDesktop: width >= 1024,
    };
  };

  const [status, setStatus] = React.useState(getStatus);

  React.useEffect(() => {
    const onResize = () => setStatus(getStatus());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return status;
}
