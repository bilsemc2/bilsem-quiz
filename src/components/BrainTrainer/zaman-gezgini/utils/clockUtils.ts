export const getRandomTime = (): Date => {
  const date = new Date();
  // Random hour 1-12
  const hours = Math.floor(Math.random() * 12) + 1;
  // Random minutes in 5 minute intervals to make it cleaner for kids
  const minutes = Math.floor(Math.random() * 12) * 5; 
  
  date.setHours(hours);
  date.setMinutes(minutes);
  date.setSeconds(0);
  return date;
};

export const addMinutes = (date: Date, minutes: number): Date => {
  const newDate = new Date(date);
  newDate.setMinutes(date.getMinutes() + minutes);
  return newDate;
};

// Convert degrees (0-360, where 0 is 12 o'clock) to minutes (0-59)
export const degreesToMinutes = (degrees: number): number => {
  // Normalize degrees to 0-360
  let d = degrees % 360;
  if (d < 0) d += 360;
  
  const minutes = Math.round((d / 360) * 60);
  return minutes === 60 ? 0 : minutes;
};

// Convert minutes to degrees (0 is 12 o'clock)
export const minutesToDegrees = (minutes: number): number => {
  return (minutes / 60) * 360;
};

// Calculate angle from center of clock to mouse position
export const getAngle = (centerX: number, centerY: number, mouseX: number, mouseY: number): number => {
  const x = mouseX - centerX;
  const y = mouseY - centerY;
  
  // atan2 returns angle in radians from -PI to PI, with 0 being 3 o'clock
  let rad = Math.atan2(y, x);
  let deg = rad * (180 / Math.PI);
  
  // Convert to clock coordinates: 0 degrees at 12 o'clock
  // atan2 0 is at 3 o'clock (90 degrees in clock terms)
  // We add 90 degrees to align standard cartesian 0 with clock 12
  deg += 90;
  
  if (deg < 0) deg += 360;
  return deg;
};