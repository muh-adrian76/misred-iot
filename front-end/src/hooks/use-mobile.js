import * as React from "react"


export function useIsMobile(breakpoint = 1025) {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < breakpoint)
    return () => mql.removeEventListener("change", onChange);
  }, [])

  return !!isMobile
}
