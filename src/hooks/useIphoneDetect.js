import { useState, useEffect } from 'react';

// Custom hook to detect iPhone or mobile device
const useIphoneDetect = () => {
  const [isIphone, setIsIphone] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipod/.test(userAgent)) {
      setIsIphone(true);
    } else if (/android|webos|iphone|ipad|ipod/.test(userAgent)) {
      setIsIphone(false);
    }
  }, []);

  return isIphone;
};

export default useIphoneDetect;
