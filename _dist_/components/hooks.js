import {useEffect, useMemo, useState} from "../../web_modules/react.js";
export const useMediaQuery = (query) => {
  const match = useMemo(() => window.matchMedia(query), [query]);
  const [active, setActive] = useState(match.matches);
  useEffect(() => {
    const listen = () => {
      setActive(match.matches);
    };
    match.addEventListener("change", listen);
    return () => {
      match.removeEventListener("change", listen);
    };
  });
  return active;
};
